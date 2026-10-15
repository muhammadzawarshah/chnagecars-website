#!/usr/bin/env python3
"""Resumable downloads of exact API image URLs; failures are never placeholders."""
import hashlib, json, os, pathlib, shutil, sqlite3, subprocess, time, argparse, fcntl
from urllib.parse import urlsplit

ROOT = pathlib.Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--reuse-only', action='store_true', help='Only reuse exact existing downloads; leave blocked images pending.')
parser.add_argument('--retry-failed', action='store_true')
parser.add_argument('--urls-file', type=pathlib.Path, help='NDJSON of exact image URLs; download only these database references.')
parser.add_argument('--workers', type=int, default=12, choices=range(1, 33))
parser.add_argument('--batch-size', type=int, default=250, choices=range(1, 2001))
parser.add_argument('--reserve-gib', type=int, default=20, choices=range(8, 101))
args = parser.parse_args()
STATE = ROOT / 'backend/.local/dealertrade'
STATE.mkdir(parents=True, exist_ok=True)
lock = (STATE / 'download.lock').open('a+')
try:
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
except BlockingIOError:
    raise SystemExit('Another dealer-photo downloader is already running.')
lock.seek(0); lock.truncate(); lock.write(str(os.getpid())); lock.flush()
MEDIA = ROOT / 'public/media/dealertrade'
MEDIA.mkdir(parents=True, exist_ok=True)
db = sqlite3.connect(STATE / 'images.sqlite')
db.execute('CREATE TABLE IF NOT EXISTS images (url TEXT PRIMARY KEY, path TEXT NOT NULL, status TEXT NOT NULL DEFAULT "pending", bytes INTEGER, error TEXT)')
db.execute('CREATE TABLE IF NOT EXISTS pages (name TEXT PRIMARY KEY, sha TEXT NOT NULL)')
db.execute('CREATE INDEX IF NOT EXISTS images_status_idx ON images(status)')
scope = ''
if args.urls_file:
    db.execute('CREATE TEMP TABLE selected_urls (url TEXT PRIMARY KEY)')
    db.executemany('INSERT OR IGNORE INTO selected_urls VALUES (?)', ((json.loads(line),) for line in args.urls_file.open() if line.strip()))
    scope = ' AND url IN (SELECT url FROM selected_urls)'
if args.retry_failed:
    db.execute('UPDATE images SET status="pending",error=NULL WHERE status="failed"' + scope);db.commit()

def valid(path):
    if not path.exists() or path.stat().st_size < 16: return False
    with path.open('rb') as f:
        h = f.read(16)
        f.seek(-12, 2); tail = f.read()
    if h[:2] == b'\xff\xd8': return tail.rstrip().endswith(b'\xff\xd9')
    if h[:8] == b'\x89PNG\r\n\x1a\n': return tail == b'\0\0\0\0IEND\xaeB`\x82'
    if h[:4] == b'RIFF' and h[8:12] == b'WEBP': return int.from_bytes(h[4:8], 'little') + 8 == path.stat().st_size
    return False

def plan_urls(urls):
    jobs = []
    for url in urls:
        u = urlsplit(url)
        if u.scheme != 'https' or u.hostname != 'www.changecars.co.za':
            raise ValueError('Unexpected API image host: ' + str(u.hostname))
        suffix = pathlib.PurePosixPath(u.path).suffix.lower()
        if suffix not in ('.jpg', '.jpeg', '.png', '.webp'): suffix = '.jpg'
        name = hashlib.sha256(url.encode()).hexdigest() + suffix
        jobs.append((url, '/media/dealertrade/' + name))
    db.executemany('INSERT OR IGNORE INTO images(url,path) VALUES (?,?)', jobs)
    db.commit()

def plan(rows):
    plan_urls(photo if photo.startswith('https://') else r['cdn_url'].rstrip('/') + '/' + photo.lstrip('/') for r in rows for photo in r.get('photos') or [])

planned = False
def discover():
    global planned
    if args.urls_file:
        if not planned:
            plan_urls(row[0] for row in db.execute('SELECT url FROM selected_urls'))
            planned = True
        return
    snapshot = STATE / 'stock-all.json'
    if planned or not snapshot.exists(): return
    rows = json.loads(snapshot.read_text())
    plan(rows)
    # Keep the manifest scoped to the verified current snapshot on subsequent runs.
    db.execute('CREATE TEMP TABLE current_urls (url TEXT PRIMARY KEY)')
    db.executemany('INSERT OR IGNORE INTO current_urls VALUES (?)', ((p if p.startswith('https://') else r['cdn_url'].rstrip('/')+'/'+p.lstrip('/'),) for r in rows for p in r.get('photos') or []))
    db.execute('DELETE FROM images WHERE url NOT IN (SELECT url FROM current_urls)');db.commit()
    planned = True

# Reuse an existing verified download only when the complete source URL is equal.
old = ROOT / 'backend/prisma/fixtures/fbook/images.json'
reuse = {}
if old.exists():
    for m in json.loads(old.read_text()):
        if not m.get('error') and m.get('source') and m.get('url'):
            reuse[m['source']] = ROOT / 'public' / m['url'].lstrip('/')

processed = 0
blocked_reason = None
preflight_done = False
while True:
    discover()
    if not planned:
        time.sleep(5);continue
    if args.reuse_only:
        if not args.urls_file and not (STATE / 'stock-all.json').exists():
            time.sleep(5);continue
        if not args.urls_file: plan(json.loads((STATE / 'stock-all.json').read_text()))
        for url, relative in db.execute('SELECT url,path FROM images WHERE status!="ready"' + scope).fetchall():
            dest = ROOT / 'public' / relative.lstrip('/')
            previous = reuse.get(url)
            if not dest.exists() and previous and valid(previous): os.link(previous, dest)
            if valid(dest): db.execute('UPDATE images SET status="ready",bytes=?,error=NULL WHERE url=?', (dest.stat().st_size,url))
        db.commit()
        break
    pending = db.execute('SELECT url,path FROM images WHERE status="pending"' + scope + ' LIMIT ?', (args.batch_size,)).fetchall()
    if not pending:
        if args.urls_file: break
        if (STATE / 'stock-all.json').exists():
            plan(json.loads((STATE / 'stock-all.json').read_text()))
            if not db.execute('SELECT 1 FROM images WHERE status="pending" LIMIT 1').fetchone(): break
        time.sleep(5); continue
    if shutil.disk_usage(MEDIA).free < args.reserve_gib * 1024 ** 3:
        raise RuntimeError(f'Stopped before exhausting disk; fewer than {args.reserve_gib} GiB free. Resume after freeing storage.')
    transfers = []
    for url, relative in pending:
        dest = ROOT / 'public' / relative.lstrip('/')
        previous = reuse.get(url)
        if not dest.exists() and previous and valid(previous): os.link(previous, dest)
        if valid(dest):
            db.execute('UPDATE images SET status="ready",bytes=?,error=NULL WHERE url=?', (dest.stat().st_size, url))
        else:
            transfers.append((url, dest))
    db.commit()
    if transfers and not preflight_done:
        preflight_done = True
        probe = subprocess.run(['curl','--http1.1','--silent','--show-error','--max-time','30','--write-out','\n%{http_code}',transfers[0][0]],capture_output=True)
        if probe.stdout.endswith(b'\n403') and b'Cloudflare' in probe.stdout:
            blocked_reason = 'Source CDN returned Cloudflare HTTP 403; no further network downloads attempted. Exact existing local images reused.'
            print(blocked_reason,flush=True)
            args.reuse_only = True
            continue
    if transfers:
        config = STATE / 'image-downloads.conf'
        config.write_text('\nnext\n'.join('url = '+json.dumps(url)+'\noutput = '+json.dumps(str(dest)+'.part')+'\nfail\nlocation\nmax-redirs = 3\nproto = "=https"\nproto-redir = "=https"\nconnect-timeout = 15\nmax-time = 60\nmax-filesize = 31457280\nretry = 2\nretry-delay = 1\nsilent\nshow-error' for url, dest in transfers))
        with (STATE / 'image-errors.log').open('a') as err:
            subprocess.run(['curl', '--http1.1', '--parallel', '--parallel-immediate', '--parallel-max', str(args.workers), '--config', str(config)], stderr=err, stdout=subprocess.DEVNULL)
        for url, dest in transfers:
            temp = pathlib.Path(str(dest)+'.part')
            if valid(temp):
                temp.replace(dest)
                db.execute('UPDATE images SET status="ready",bytes=?,error=NULL WHERE url=?', (dest.stat().st_size, url))
            else:
                temp.unlink(missing_ok=True)
                db.execute('UPDATE images SET status="failed",error="HTTP download failed or incomplete/unsupported image" WHERE url=?', (url,))
        db.commit()
    processed += len(pending)
    counts = dict(db.execute('SELECT status,count(*) FROM images WHERE 1=1' + scope + ' GROUP BY status'))
    (STATE / 'download-progress.json').write_text(json.dumps({'at': time.time(), 'processed': processed, **counts}))
    print(json.dumps({'processed': processed, **counts}), flush=True)

report = dict(db.execute('SELECT status,count(*) FROM images WHERE 1=1' + scope + ' GROUP BY status'))
report['bytes'] = db.execute('SELECT coalesce(sum(bytes),0) FROM images WHERE status="ready"' + scope).fetchone()[0]
if blocked_reason: report['blockedReason'] = blocked_reason
report['failedImages'] = [{'url': u, 'error': e} for u,e in db.execute('SELECT url,error FROM images WHERE status="failed"' + scope)]
(STATE / 'download-report.json').write_text(json.dumps(report, indent=2))
# Export a portable manifest alongside SQLite checkpoints.
with (STATE / 'images.ndjson').open('w') as out:
    for url,path,status,size in db.execute('SELECT url,path,status,bytes FROM images WHERE 1=1' + scope):
        out.write(json.dumps({'source':url,'url':path,'status':status,'bytes':size})+'\n')
print(json.dumps({k:v for k,v in report.items() if k != 'failedImages'}), flush=True)
if report.get('failed', 0) or report.get('pending',0): raise SystemExit(1)
