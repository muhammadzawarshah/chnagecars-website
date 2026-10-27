#!/usr/bin/env python3
"""Capture live rows in small dealer partitions so global pagination cannot skip old stock."""
import argparse, concurrent.futures, hashlib, json, os, pathlib, re, subprocess, threading, time

ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=pathlib.Path(os.environ.get('DEALERTRADE_OUTPUT_DIR', str(ROOT/'backend/.local/dealertrade-reconcile/source'))).resolve()
OUT.mkdir(parents=True,exist_ok=True)
TOKEN=os.environ.get('DEALERTRADE_TOKEN') or (ROOT/'backend/.local/dealertrade/token').read_text().strip()
lock=threading.Lock(); next_request=0.0
started=time.time()
parser=argparse.ArgumentParser();parser.add_argument('--resume',action='store_true');args=parser.parse_args()

def request(endpoint,body,page=1,label=''):
    global next_request
    headers=OUT/(label.replace('/','-')+f'-{page}.headers')
    for attempt in range(7):
        with lock:
            delay=max(0,next_request-time.monotonic())
            if delay:time.sleep(delay)
            next_request=time.monotonic()+1.4
        config='header = '+json.dumps('Authorization: Bearer '+TOKEN)+'\n'
        p=subprocess.run(['curl','--config','-','--http1.1','--tls-max','1.2','--fail','--silent','--show-error','--max-time','120','--header','Content-Type: application/json','--header','Accept: application/json','--dump-header',str(headers),'--data',json.dumps(body),f'https://dealertrade.co.za/api/apk/{endpoint}?page={page}&per_page=1000'],input=config.encode(),capture_output=True)
        if not p.returncode:
            value=json.loads(p.stdout)
            if value.get('current_page')==page and isinstance(value.get('data'),list):return value
        h=headers.read_text() if headers.exists() else ''
        match=re.search(r'^retry-after:\s*(\d+)',h,re.I|re.M)
        delay=int(match.group(1)) if match else (60 if '429' in p.stderr.decode() else min(2**attempt,30))
        if '429' in p.stderr.decode():
            with lock:next_request=max(next_request,time.monotonic()+delay)
            print(f'{label}: API rate limit; respecting {delay}s cooldown',flush=True)
        time.sleep(delay)
    raise RuntimeError(f'Unable to fetch {label} page {page}: {p.stderr.decode()[:160]}')

def save(path,value):
    temp=path.with_suffix('.part');temp.write_text(json.dumps(value,ensure_ascii=False));temp.replace(path)

dealers_first=request('dealers',{'sources':[]},label='dealers')
dealers=list(dealers_first['data'])
for page in range(2,dealers_first['last_page']+1):dealers.extend(request('dealers',{'sources':[]},page,'dealers')['data'])
if len({r['dealer_id'] for r in dealers})!=dealers_first['total']:raise RuntimeError('Dealer list shifted; retry before reconciling')
save(OUT/'dealers.json',dealers)
head=request('stock/by-dealers',{},label='initial-head');save(OUT/'initial-head.json',head)
dealer_ids={int(r['dealer_id'])for r in dealers+head['data']}
for relative in ['backend/.local/dealertrade/stock-all.json','backend/.local/dealertrade-audit/stock-observed.json','backend/prisma/fixtures/fbook/listings.json']:
    path=ROOT/relative
    if path.exists():dealer_ids.update(int(r['dealer_id'])for r in json.loads(path.read_text()))
ordered=sorted(dealer_ids);groups=[ordered[i:i+10]for i in range(0,len(ordered),10)]
print(f'{len(dealers)} dealers; fetching {len(ordered)} known dealer identities in {len(groups)} partitions',flush=True)

def partition(item):
    index,ids=item;folder=OUT/f'partition-{index:03d}';folder.mkdir(exist_ok=True)
    complete=folder/'complete.json'
    if args.resume and complete.exists():
        previous=json.loads(complete.read_text())
        if previous['dealerIds']==ids:return previous
    for attempt in range(3):
        first=request('stock/by-dealers',{'dealer_ids':ids},label=f'partition-{index}')
        pages=[first];save(folder/'1.json',first)
        for page in range(2,first['last_page']+1):
            value=request('stock/by-dealers',{'dealer_ids':ids},page,f'partition-{index}');pages.append(value);save(folder/f'{page}.json',value)
        rows=[r for p in pages for r in p['data']]
        if any(int(r['dealer_id'])not in ids for r in rows):raise RuntimeError('API ignored documented dealer_ids filter')
        if len(rows)==len({r['vehicle_id']for r in rows})==first['total'] and all(p['total']==first['total']for p in pages):
            result={'dealerIds':ids,'rows':rows,'total':first['total'],'capturedAt':time.time()};save(folder/'complete.json',result);return result
        print(f'Partition {index} shifted while paging; retry {attempt+1}/3',flush=True)
    # Some source pages repeat equal-timestamp rows. Requery the affected dealers
    # individually and require the resulting identity union to reach the API total.
    seen=set();duplicate_dealers=set()
    for row in rows:
        if row['vehicle_id']in seen:duplicate_dealers.add(int(row['dealer_id']))
        seen.add(row['vehicle_id'])
    observed={str(r['vehicle_id']):r for r in rows}
    for dealer_id in sorted(duplicate_dealers):
        single=request('stock/by-dealers',{'dealer_ids':[dealer_id]},label=f'partition-{index}-dealer-{dealer_id}')
        save(folder/f'dealer-{dealer_id}-1.json',single)
        for row in single['data']:observed[str(row['vehicle_id'])]=row
        for page in range(2,single['last_page']+1):
            value=request('stock/by-dealers',{'dealer_ids':[dealer_id]},page,f'partition-{index}-dealer-{dealer_id}');save(folder/f'dealer-{dealer_id}-{page}.json',value)
            for row in value['data']:observed[str(row['vehicle_id'])]=row
    confirm=request('stock/by-dealers',{'dealer_ids':ids},label=f'partition-{index}-confirm');save(folder/'confirm.json',confirm)
    for row in confirm['data']:observed[str(row['vehicle_id'])]=row
    if len(observed)==confirm['total'] and all(int(r['dealer_id'])in ids for r in observed.values()):
        result={'dealerIds':ids,'rows':list(observed.values()),'total':confirm['total'],'capturedAt':time.time(),'recovery':'Duplicate page boundaries recovered with individual dealer reads; unique row count matches fresh partition total'};save(complete,result);return result
    raise RuntimeError(f'Partition {index} remained unstable; no complete reconcile source emitted')

results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
    for result in pool.map(partition,enumerate(groups)):
        results.append(result)
        print(f'Partitions {len(results)}/{len(groups)}; {sum(len(r["rows"])for r in results)} captured cars',flush=True)

rows={str(r['vehicle_id']):r for result in results for r in result['rows']}
# Catch newly added stock at the global head, including new dealers during capture.
last=request('stock/by-dealers',{},label='final-head');save(OUT/'final-head.json',last)
for row in last['data']:rows[str(row['vehicle_id'])]=row
save(OUT/'vehicles.json',list(rows.values()))
report={'startedAtEpoch':started,'completedAtEpoch':time.time(),'dealerRows':len(dealers),'dealerIdentitiesQueried':len(ordered),'partitionsCompleted':len(results),'uniqueVehicleRows':len(rows),'initialGlobalTotal':head['total'],'finalGlobalTotal':last['total'],'stockMeta':last.get('meta',{}),'initialStockMeta':head.get('meta',{}),'atomicSnapshot':False,'strategy':'All known dealer identities queried in validated, unique, count-stable partitions; final global head refreshed. No absence-based deletion allowed.','vehiclesSha256':hashlib.sha256((OUT/'vehicles.json').read_bytes()).hexdigest()}
save(OUT/'fetch-report.json',report);print(json.dumps(report),flush=True)
