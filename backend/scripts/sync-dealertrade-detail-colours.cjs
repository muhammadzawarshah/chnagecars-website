/** Update supplier paint names only; Vehicle.colour and filter manifests stay unchanged. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const { Client } = require('pg');
const sourceIndex = process.argv.indexOf('--source');
if (sourceIndex < 0 || !process.argv[sourceIndex + 1]) throw Error('Use --source /path/to/dealertrade-stock.json [--apply]');
const sourcePath = path.resolve(process.argv[sourceIndex + 1]);
const apply = process.argv.includes('--apply');
const url = new URL(process.env.DATABASE_URL);
if (url.hostname !== '127.0.0.1' || url.port !== '55432' || url.pathname !== '/changecars') throw Error('Local database only');
const input = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
if (!Array.isArray(input)) throw Error('Expected a stock array');
const unique = new Map();
for (const row of input) {
  if (!/^\d+$/.test(String(row.vehicle_id)) || !/^\d+$/.test(String(row.dealer_id))) continue;
  if (!Object.hasOwn(row, 'colour') || (row.colour !== null && typeof row.colour !== 'string')) continue;
  const id = String(row.vehicle_id);
  if (unique.has(id)) throw Error('Duplicate vehicle ID in source');
  unique.set(id, { id, dealerId: String(row.dealer_id), colour: row.colour });
}
const output = path.resolve(__dirname, '../.local/dealertrade-detail-colours', new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(output, { recursive: true });
const digest = rows => crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex');

(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    await db.connect();
    await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    await db.query("SET LOCAL lock_timeout='10s'");
    await db.query('CREATE TEMP TABLE detail_colour_source (id text PRIMARY KEY,"dealerId" text,colour text) ON COMMIT DROP');
    await db.query('INSERT INTO detail_colour_source SELECT id,"dealerId",colour FROM jsonb_to_recordset($1::jsonb) AS s(id text,"dealerId" text,colour text)', [JSON.stringify([...unique.values()])]);
    const matched = (await db.query(`SELECT v.id,v."dealerId",v.colour AS "filterColour",v."sourceData"->'dealertrade'->'colour' AS "previousSourceColour",(v."sourceData"->'dealertrade') ? 'colour' AS "hadSourceColour",s.colour AS "newSourceColour" FROM vehicles v JOIN detail_colour_source s ON v.id=s.id AND v."dealerId"=s."dealerId" WHERE v."sourceData"->'dealertrade'->>'vehicle_id'=s.id ORDER BY v.id FOR UPDATE OF v`)).rows;
    const mismatchCount = Number((await db.query(`SELECT count(*) n FROM vehicles v JOIN detail_colour_source s ON s.id=v.id WHERE v."dealerId"<>s."dealerId" OR v."sourceData"->'dealertrade'->>'vehicle_id' IS DISTINCT FROM s.id`)).rows[0].n);
    // Skip vehicles whose dealer/source ownership no longer matches the captured record.
    const before = (await db.query('SELECT id,colour FROM vehicles ORDER BY id')).rows;
    const snapshotsBefore = (await db.query('SELECT revision,sha256 FROM vehicle_filter_snapshots ORDER BY revision')).rows;
    fs.writeFileSync(path.join(output, 'before.json'), JSON.stringify(matched), { mode: 0o600 });
    let updated = 0;
    if (apply) {
      const result = await db.query(`UPDATE vehicles v SET "sourceData"=jsonb_set(v."sourceData",'{dealertrade,colour}',COALESCE(to_jsonb(s.colour),'null'::jsonb),true) FROM detail_colour_source s WHERE v.id=s.id AND v."dealerId"=s."dealerId" AND v."sourceData"->'dealertrade'->>'vehicle_id'=s.id AND v."sourceData"->'dealertrade'->'colour' IS DISTINCT FROM COALESCE(to_jsonb(s.colour),'null'::jsonb)`);
      updated = result.rowCount;
    }
    const after = (await db.query('SELECT id,colour FROM vehicles ORDER BY id')).rows;
    const snapshotsAfter = (await db.query('SELECT revision,sha256 FROM vehicle_filter_snapshots ORDER BY revision')).rows;
    if (digest(before) !== digest(after)) throw Error('Stored filter colours changed');
    if (digest(snapshotsBefore) !== digest(snapshotsAfter)) throw Error('Stored manifest snapshots changed');
    await db.query(apply ? 'COMMIT' : 'ROLLBACK');
    const report = { mode: apply ? 'applied' : 'plan', source: sourcePath, sourceRows: input.length,
      matchedVehicles: matched.length, ownershipMismatchesSkipped: mismatchCount, nonemptyApiColours: matched.filter(r => typeof r.newSourceColour === 'string' && r.newSourceColour.trim()).length,
      detailColourRowsUpdated: updated, filterColourRowsUnchanged: before.length, filterColourChecksum: digest(before),
      manifestSnapshotsUnchanged: snapshotsBefore.length, backup: path.join(output, 'before.json') };
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } catch (error) { await db.query('ROLLBACK').catch(() => {}); throw error; }
  finally { await db.end(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
