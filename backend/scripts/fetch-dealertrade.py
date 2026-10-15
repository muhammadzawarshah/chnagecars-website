#!/usr/bin/env python3
"""Read-only, paginated DealerTrade snapshots. Token stays outside source control."""
import argparse, concurrent.futures, hashlib, json, os, pathlib, re, subprocess, time

ROOT = pathlib.Path(__file__).resolve().parents[2]
DEFAULT_OUT = ROOT / 'backend/.local/dealertrade'
OUT = pathlib.Path(os.environ.get('DEALERTRADE_OUTPUT_DIR', str(DEFAULT_OUT))).resolve()
OUT.mkdir(parents=True, exist_ok=True)
TOKEN = os.environ.get('DEALERTRADE_TOKEN') or (DEFAULT_OUT / 'token').read_text().strip()
parser = argparse.ArgumentParser()
parser.add_argument('--resume', action='store_true', help='Explicitly resume a previously interrupted snapshot instead of fetching fresh pages.')
parser.add_argument('--workers', type=int, choices=range(1,9), default=4)
parser.add_argument('--observe-changing', action='store_true', help='Audit only: retain and deduplicate a changing live traversal; never emit an importable all.json file.')
args = parser.parse_args()

def request(endpoint, page, per_page):
    config = 'header = ' + json.dumps('Authorization: Bearer ' + TOKEN) + '\n'
    url = f'https://dealertrade.co.za/api/apk/{endpoint}?page={page}&per_page={per_page}'
    headers = OUT / f'{endpoint.replace("/", "-")}-{page}.headers'
    for attempt in range(5):
        p = subprocess.run(['curl', '--config', '-', '--fail', '--silent', '--show-error',
            '--max-time', '180', '--header', 'Content-Type: application/json',
            '--header', 'Accept: application/json', '--dump-header', str(headers), '--data',
            json.dumps({'sources': []} if endpoint == 'dealers' else {}), url],
            input=config.encode(), capture_output=True)
        if not p.returncode:
            data = json.loads(p.stdout)
            if data.get('current_page') == page and isinstance(data.get('data'), list):
                return data
        response_headers = headers.read_text() if headers.exists() else ''
        retry_after = re.search(r'^retry-after:\s*(\d+)', response_headers, re.I | re.M)
        delay = max(2 ** attempt, int(retry_after.group(1))) if retry_after else (60 if '429' in p.stderr.decode() else 2 ** attempt)
        if '429' in p.stderr.decode(): print(f'{endpoint} page {page}: rate limited; waiting {delay}s', flush=True)
        time.sleep(delay)
    raise RuntimeError(f'Failed {endpoint} page {page}: {p.stderr.decode()[:200]}')

def fetch(name, endpoint):
    first = request(endpoint, 1, 1000)
    folder = OUT / (name + '-pages')
    if folder.exists() and not args.resume:
        folder.rename(OUT / f'{name}-pages-previous-{time.time_ns()}')
    folder.mkdir(exist_ok=True)
    (folder / '1.json').write_text(json.dumps(first))
    def page(n):
        path = folder / f'{n}.json'
        if path.exists():
            value = json.loads(path.read_text())
            if (args.observe_changing or value.get('total') == first['total']) and value.get('per_page') == first['per_page']:
                return n, value
        value = request(endpoint, n, first['per_page'])
        path.write_text(json.dumps(value))
        return n, value
    pages = {1: first}
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        for n, value in pool.map(page, range(2, first['last_page'] + 1)):
            pages[n] = value
            if len(pages) % 10 == 0:
                print(f'{name}: {len(pages)}/{first["last_page"]} pages', flush=True)
    rows = [r for n in sorted(pages) for r in pages[n]['data']]
    key = 'dealer_id' if name == 'dealers' else 'vehicle_id'
    ids = [r[key] for r in rows]
    totals = sorted(set(value['total'] for value in pages.values()))
    if args.observe_changing:
        observed = {}
        # Preserve the latest saved occurrence when shifting offsets repeat a row.
        for n in sorted(pages, key=lambda n: (folder / f'{n}.json').stat().st_mtime):
            for row in pages[n]['data']: observed[str(row[key])] = row
        target = OUT / (name + '-observed.json')
        target.write_text(json.dumps(list(observed.values()), ensure_ascii=False))
        metadata = {'mode':'non-atomic live traversal; audit only', 'pageCount':len(pages), 'expectedPageCount':first['last_page'], 'reportedTotals':totals, 'rowsObserved':len(rows), 'uniqueRowsObserved':len(observed), 'duplicateObservations':len(rows)-len(observed), 'atomicSnapshot':False, 'importable':False, 'firstPageSavedAt':(folder/'1.json').stat().st_mtime, 'firstSavedPageAt':min(p.stat().st_mtime for p in folder.glob('*.json')), 'lastSavedPageAt':max(p.stat().st_mtime for p in folder.glob('*.json')), 'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
        (OUT / (name + '-observation-report.json')).write_text(json.dumps(metadata,indent=2))
        print(f'{name}: {len(observed)} unique observed rows; non-atomic live traversal; not importable',flush=True)
        return
    if len(totals) != 1:
        raise RuntimeError(f'{name}: live totals changed during paging: {totals}. No importable snapshot emitted. Use a source export or --observe-changing for an explicitly non-atomic audit.')
    if len(ids) != len(set(ids)) or len(rows) != first['total']:
        raise RuntimeError(f'{name}: snapshot shifted while paging; {len(rows)} rows, {len(set(ids))} unique, expected {first["total"]}. Retry with a fresh pages directory.')
    target = OUT / (name + '-all.json')
    target.write_text(json.dumps(rows, ensure_ascii=False))
    print(f'{name}: verified {len(rows)} unique rows; sha256={hashlib.sha256(target.read_bytes()).hexdigest()}', flush=True)

if __name__ == '__main__':
    fetch('dealers', 'dealers')
    fetch('stock', 'stock/by-dealers')
