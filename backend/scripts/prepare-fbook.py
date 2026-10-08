#!/usr/bin/env python3
"""Preserve the feed and download only its explicit image URLs, resumably."""
import argparse, concurrent.futures, hashlib, json, pathlib, time, subprocess, re, xml.etree.ElementTree as ET
ROOT = pathlib.Path(__file__).resolve().parents[2]
p = argparse.ArgumentParser()
p.add_argument('--source', default=str(ROOT/'backend/prisma/fixtures/fbook/source.xml'))
p.add_argument('--workers', type=int, default=32)
p.add_argument('--prepare-only', action='store_true')
a = p.parse_args()
if not 1 <= a.workers <= 64: p.error("workers must be between 1 and 64")
fixture = ROOT/'backend/prisma/fixtures/fbook'
fixture.mkdir(parents=True, exist_ok=True)
raw = pathlib.Path(a.source).read_bytes()
# This export contains whitespace before its XML declaration.
root = ET.fromstring(raw.lstrip())
rows = []
for el in root.findall('listing'):
    row = {c.tag: (c.text or '').strip() for c in el if c.tag not in ('image', 'address', 'mileage')}
    if not re.fullmatch(r'\d+', row['vehicle_id']) or not re.fullmatch(r'\d+', row['dealer_id']): raise ValueError('Invalid source ID')
    row['mileage'] = {c.tag: (c.text or '').strip() for c in el.find('mileage')}
    row['address'] = {c.get('name'): (c.text or '').strip() for c in el.findall('address/component')}
    row['images'] = [(x.text or '').strip() for x in el.findall('image/url')]
    rows.append(row)
ids = [r['vehicle_id'] for r in rows]
if len(set(ids)) != len(ids): raise ValueError('Duplicate vehicle IDs in feed')
(fixture/'listings.json').write_text(json.dumps(rows, ensure_ascii=False))
print(f'Prepared {len(rows)} listings, {len(set(r["dealer_id"] for r in rows))} dealers', flush=True)
if a.prepare_only: raise SystemExit()
output = ROOT/'public/media/fbook'
output.mkdir(parents=True, exist_ok=True)
jobs = [(r['vehicle_id'], i, url) for r in rows for i, url in enumerate(r['images'])]
def valid_image(path):
    if not path.exists(): return False
    data=path.read_bytes()
    if data.startswith(b'\xff\xd8'): return data.rstrip().endswith(b'\xff\xd9')
    if data.startswith(b'\x89PNG'): return data.endswith(b'IEND\xaeB`\x82')
    if data.startswith(b'RIFF'): return len(data)>=12 and int.from_bytes(data[4:8],'little')+8==len(data) and data[8:12]==b'WEBP'
    if data[4:8]==b'ftyp':
        pos=0
        while pos<len(data):
            if pos+8>len(data): return False
            size=int.from_bytes(data[pos:pos+4],'big')
            if size==0: return True
            if size==1:
                if pos+16>len(data): return False
                size=int.from_bytes(data[pos+8:pos+16],'big')
            if size<8 or pos+size>len(data): return False
            pos+=size
        return pos==len(data)
    return False

def download(job):
    vid, i, url = job
    if not url.startswith('https://www.changecars.co.za/'): return {'vehicleId':vid,'source':url,'error':'Unexpected image host'}
    extension = url.rsplit('.', 1)[-1].lower()
    name = f'{vid}-{i+1}.{extension}'
    request_url = url.rsplit('.', 1)[0]+'.'+extension
    dest = output/name
    if valid_image(dest):
        return {'vehicleId':vid,'position':i,'source':url,'url':f'/media/fbook/{name}','bytes':dest.stat().st_size}
    for attempt in range(3):
        try:
            temp = dest.with_suffix('.part')
            candidate = url if attempt == 1 else request_url
            subprocess.run(['curl','--http1.1','--fail','--silent','--show-error','--location','--max-time','30','--output',str(temp),candidate], check=True, capture_output=True)
            data = temp.read_bytes()
            if not valid_image(temp): raise ValueError('Incomplete or invalid image bytes')
            temp = dest.with_suffix('.part');temp.write_bytes(data);temp.replace(dest)
            return {'vehicleId':vid,'position':i,'source':url,'url':f'/media/fbook/{name}','bytes':len(data)}
        except Exception as exc:
            error = exc.stderr.decode("utf-8",errors="replace").strip() if isinstance(exc,subprocess.CalledProcessError) and exc.stderr else str(exc)
            time.sleep(attempt+1)
    temp = dest.with_suffix('.part')
    if temp.exists(): temp.unlink()
    return {'vehicleId':vid,'position':i,'source':url,'error':error,'url':'/img/feed-image-unavailable.png','placeholder':True}
# curl's multi interface reuses connections instead of launching one process per image.
pending = []
for vid, i, url in jobs:
    extension = url.rsplit('.', 1)[-1].lower()
    dest = output/f'{vid}-{i+1}.{extension}'
    old = output/f'{vid}-{i+1}.jpg'
    if extension != 'jpg' and old.exists() and not dest.exists(): old.replace(dest)
    temp = dest.with_suffix('.part')
    if temp.exists():
        data = temp.read_bytes()
        if valid_image(temp):temp.replace(dest)
    if not valid_image(dest):
        if not url.startswith('https://www.changecars.co.za/'): raise ValueError('Unexpected image host')
        pending.append((url.rsplit('.',1)[0]+'.'+extension, dest))
if pending:
    config = fixture/'curl-downloads.conf'
    config.write_text('\nnext\n'.join(f'url = {json.dumps(url)}\noutput = {json.dumps(str(dest.with_suffix(".part")))}\nfail\nlocation\nhttp1.1\nretry = 2\nretry-delay = 1\nmax-time = 30\nsilent\nshow-error\nwrite-out = "%{{http_code}}\\n"' for url, dest in pending))
    command = ['curl','--http1.1','--parallel-immediate','--parallel','--parallel-max',str(a.workers),'--fail','--location','--retry','2','--retry-delay','1','--max-time','30','--silent','--show-error','--write-out','%{http_code}\n','--config',str(config)]
    with (fixture/'curl-errors.log').open('w') as errors:
        proc = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=errors, text=True)
        completed = 0
        for line in proc.stdout:
            completed += 1
            if completed % 250 == 0: print(f'HTTP downloads {completed}/{len(pending)}',flush=True)
        proc.wait()
    for url,dest in pending:
        temp=dest.with_suffix('.part')
        if temp.exists():
            data=temp.read_bytes()
            if valid_image(temp):temp.replace(dest)
            else:temp.unlink()
    config.unlink()
results = []
with concurrent.futures.ThreadPoolExecutor(max_workers=a.workers) as pool:
    for result in pool.map(download, jobs):
        results.append(result)
        if len(results)%250 == 0:
            print(f'{len(results)}/{len(jobs)} images; failures {sum("error" in r for r in results)}',flush=True)
            (fixture/'images.json').write_text(json.dumps(results))
(fixture/'images.json').write_text(json.dumps(results,indent=2))
report = {'sourceSha256':hashlib.sha256(raw).hexdigest(),'listings':len(rows),'dealers':len(set(r['dealer_id'] for r in rows)),'images':len(jobs),'downloaded':sum('url' in r and 'error' not in r for r in results),'placeholders':sum(r.get('placeholder',False) for r in results),'failed':[r for r in results if 'error' in r]}
(fixture/'download-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps({k:v for k,v in report.items() if k!='failed'}),flush=True)
if report['failed']: raise SystemExit(1)
