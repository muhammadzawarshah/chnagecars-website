/** Local-only cleanup. Never connects to a remote host. --apply requires a successful full backup. */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const { Client } = require('pg');
const url = new URL(process.env.DATABASE_URL);
if (url.hostname !== '127.0.0.1' || url.port !== '55432' || url.pathname !== '/changecars') throw Error('Only this project’s local database 127.0.0.1:55432/changecars is allowed');
const directory = path.resolve(__dirname, '../.local/dealertrade-only');
fs.mkdirSync(directory, { recursive: true });
const uuid = key => { const h = createHash('sha256').update(`changecars-fbook:${key}`).digest('hex'); return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`; };
(async () => {
 const db = new Client({ connectionString: process.env.DATABASE_URL }); await db.connect();
 try {
  const counts = (await db.query(`SELECT count(*) total, count(*) FILTER (WHERE "sourceData"->'dealertrade'->>'vehicle_id' IS NOT NULL) dealertrade, count(*) FILTER (WHERE "sourceData"->>'vehicle_id' IS NOT NULL AND "sourceData"->'dealertrade'->>'vehicle_id' IS NULL) fbook_only FROM vehicles`)).rows[0];
  const dealers = (await db.query(`SELECT payload FROM source_feed_records WHERE source='dealertrade' AND kind='dealer'`)).rows;
  if (!dealers.length || Number(counts.dealertrade) === 0) throw Error('DealerTrade records are missing; refusing cleanup');
  const keptDealers = dealers.flatMap(row => [String(row.payload.dealer_id), uuid(`dealer:${row.payload.dealer_id}`)]);
  const candidates = (await db.query(`SELECT id,name FROM dealers d WHERE slug LIKE '%-fbook-%' AND NOT (id = ANY($1::text[])) AND NOT EXISTS (SELECT 1 FROM vehicles v WHERE v."dealerId"=d.id AND v."sourceData"->'dealertrade'->>'vehicle_id' IS NOT NULL)`, [keptDealers])).rows;
  console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'plan', ...counts, fbookOnlyDealers: candidates.length }));
  if (!process.argv.includes('--apply')) return;
  const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
  const backup = path.join(directory, `before-cleanup-${timestamp}.dump`);
  const result = spawnSync('pg_dump', ['-h', '127.0.0.1', '-p', '55432', '-U', decodeURIComponent(url.username), '-d', 'changecars', '-Fc', '-f', backup], { env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password) }, encoding:'utf8' });
  if (result.status !== 0 || !fs.existsSync(backup) || fs.statSync(backup).size < 1000) throw Error('Local backup failed; no deletion performed');
  const check = spawnSync('pg_restore', ['--list', backup], { encoding:'utf8' });
  if (check.status !== 0 || !check.stdout.includes('TABLE DATA public vehicles')) throw Error('Backup verification failed; no deletion performed');
  await db.query('BEGIN');
  try {
   await db.query('LOCK TABLE vehicles, dealers IN SHARE ROW EXCLUSIVE MODE');
   await db.query(`CREATE TEMP TABLE retained_dealertrade ON COMMIT DROP AS SELECT id,md5(to_jsonb(v)::text) fingerprint FROM vehicles v WHERE "sourceData"->'dealertrade'->>'vehicle_id' IS NOT NULL`);
   const deleted = await db.query(`DELETE FROM vehicles WHERE "sourceData"->>'vehicle_id' IS NOT NULL AND "sourceData"->'dealertrade'->>'vehicle_id' IS NULL`);
   // Remove only source-exclusive orphan dealers. Do not cascade-delete active accounts, deals or CRM.
   const removedDealers = await db.query(`DELETE FROM dealers d WHERE id=ANY($1::text[]) AND NOT EXISTS(SELECT 1 FROM vehicles WHERE "dealerId"=d.id) AND NOT EXISTS(SELECT 1 FROM dealer_members WHERE "dealerId"=d.id) AND NOT EXISTS(SELECT 1 FROM deals WHERE "dealerId"=d.id) AND NOT EXISTS(SELECT 1 FROM leads WHERE "dealerId"=d.id) AND NOT EXISTS(SELECT 1 FROM enquiries WHERE "dealerId"=d.id) RETURNING id`,[candidates.map(d=>d.id)]);
   const mismatch = (await db.query(`SELECT count(*) count FROM retained_dealertrade r LEFT JOIN vehicles v ON v.id=r.id WHERE v.id IS NULL OR md5(to_jsonb(v)::text)<>r.fingerprint`)).rows[0].count;
   if (Number(mismatch)) throw Error('Retained DealerTrade rows changed; rolling back');
   const remaining = (await db.query(`SELECT count(*) count FROM vehicles WHERE "sourceData"->>'vehicle_id' IS NOT NULL AND "sourceData"->'dealertrade'->>'vehicle_id' IS NULL`)).rows[0].count;
   if (Number(remaining)) throw Error('Fbook-only records remain; rolling back');
   await db.query('COMMIT');
   const report = { database:'127.0.0.1:55432/changecars', backup, deletedVehicles:deleted.rowCount, deletedDealers:removedDealers.rowCount, preservedDealerTradeVehicles:Number(counts.dealertrade), retainedRowsChanged:Number(mismatch), fbookOnlyRemaining:Number(remaining), otherRecordsPreserved:Number(counts.total)-Number(counts.dealertrade)-Number(counts.fbook_only) };
   fs.writeFileSync(path.join(directory,'cleanup-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
  } catch (error) { await db.query('ROLLBACK'); throw error; }
 } finally { await db.end(); }
})().catch(error=>{console.error(error.message);process.exitCode=1});
