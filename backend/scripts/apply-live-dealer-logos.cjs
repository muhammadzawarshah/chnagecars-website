/** Link only successfully published, byte-verified public logos to matching live dealers. */
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const root = path.resolve(__dirname, '..');
const state = path.join(root, '.local/live-sync');
const config = JSON.parse(fs.readFileSync(path.join(state, 'app-config.json')));
const rows = JSON.parse(fs.readFileSync(path.join(state, 'published-dealer-logos.json')));
const verified = JSON.parse(fs.readFileSync(path.join(state, 'reconcile/verification-report.json')));
if (verified.mismatches !== 0) throw Error('Production API verification must pass before linking logos');
if (rows.some(r => r.error)) throw Error('Finish failed logo uploads before linking production logos');
if (rows.length !== 762 || new Set(rows.map(r => r.id)).size !== 762) throw Error('Unexpected published-logo manifest');
for (const row of rows) {
    const url = new URL(row.url);
    if (url.hostname !== 'firebasestorage.googleapis.com' || !url.pathname.includes(encodeURIComponent('changecars/dealer-logos/')) || !row.md5 || !row.bytes) throw Error('Unverified public logo');
}
const db = new Client({ connectionString: config.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 20000, query_timeout: 120000 });
async function main() {
    await db.connect();
    const before = (await db.query('SELECT id,"logoUrl","updatedAt" FROM dealers WHERE id=ANY($1::uuid[])', [rows.map(r => r.id)])).rows;
    if (before.length !== rows.length) throw Error('A source dealer is missing from production');
    fs.writeFileSync(path.join(state, `dealer-logos-before-${Date.now()}.json`), JSON.stringify(before, null, 2), { mode: 0o600 });
    const payload = rows.map(row => ({ id: row.id, url: row.url, previous: before.find(r => r.id === row.id).logoUrl }));
    await db.query('BEGIN');
    try {
        const result = await db.query(`UPDATE dealers d SET "logoUrl"=r.url,"updatedAt"=NOW() FROM jsonb_to_recordset($1::jsonb) r(id uuid,url text,previous text) WHERE d.id=r.id AND d."logoUrl" IS NOT DISTINCT FROM r.previous`, [JSON.stringify(payload)]);
        if (result.rowCount !== rows.length) throw Error('Dealer logo changed concurrently; no logo links committed');
        await db.query('COMMIT');
    } catch (error) { await db.query('ROLLBACK'); throw error; }
    const stored = (await db.query('SELECT id,"logoUrl" FROM dealers WHERE id=ANY($1::uuid[])', [rows.map(r => r.id)])).rows;
    const mismatches = rows.filter(row => stored.find(r => r.id === row.id)?.logoUrl !== row.url);
    const report = { at: new Date().toISOString(), linked: rows.length, publicImagesByteVerified: rows.length, mismatches: mismatches.length, upstreamUnavailable: [{ dealerId: 3843, name: 'Auto Investments North Coast', status: 403 }] };
    fs.writeFileSync(path.join(state, 'dealer-logo-verification.json'), JSON.stringify(report, null, 2), { mode: 0o600 });
    console.log(report);
    if (mismatches.length) throw Error('Logo database verification failed');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.end());
