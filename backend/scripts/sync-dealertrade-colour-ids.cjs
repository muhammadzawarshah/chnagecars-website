/** Sync supplier colour IDs and fill missing standard filter colours; preserve existing labels. */
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const { Client } = require('pg');
const sourceArg = process.argv.indexOf('--source');
if (sourceArg < 0 || !process.argv[sourceArg + 1]) throw Error('Use --source stock-all.json [--apply]');
const url = new URL(process.env.DATABASE_URL);
if (url.hostname !== '127.0.0.1' || url.port !== '55432' || url.pathname !== '/changecars') throw Error('Local database only');
const rows = JSON.parse(fs.readFileSync(path.resolve(process.argv[sourceArg + 1]), 'utf8'));
if (!Array.isArray(rows)) throw Error('Expected stock array');
const ids = new Set();
const source = rows.flatMap(row => {
  if (!/^\d+$/.test(String(row.vehicle_id)) || !/^\d+$/.test(String(row.dealer_id))) throw Error('Invalid identity');
  if (ids.has(String(row.vehicle_id))) throw Error('Duplicate vehicle');
  ids.add(String(row.vehicle_id));
  if (!Object.hasOwn(row, 'colour_id')) return [];
  if (row.colour_id !== null && (!Number.isSafeInteger(row.colour_id) || row.colour_id <= 0)) throw Error('Invalid colour ID');
  return [{ id: String(row.vehicle_id), dealer: String(row.dealer_id), colour_id: row.colour_id }];
});
if (!source.length) throw Error('Source has no colour IDs; fetch a current DealerTrade snapshot first');
const standardColours = { 2:'Beige',3:'Black',4:'Blue',5:'Brown',6:'Gold',7:'Green',8:'Grey',9:'Orange',10:'Pink',11:'Purple',12:'Red',13:'Silver',15:'White',16:'Yellow' };
const apply = process.argv.includes('--apply');
const output = path.resolve(__dirname, '../.local/dealertrade-colour-ids', new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(output, { recursive: true });
(async () => {
 const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
 try {
  await db.connect();
  await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
  await db.query("SET LOCAL lock_timeout='10s'");
  await db.query('CREATE TEMP TABLE colour_ids (id text PRIMARY KEY, dealer text, colour_id integer) ON COMMIT DROP');
  await db.query('INSERT INTO colour_ids SELECT * FROM jsonb_to_recordset($1::jsonb) AS s(id text,dealer text,colour_id integer)', [JSON.stringify(source)]);
  const before = (await db.query('SELECT id,colour FROM vehicles ORDER BY id')).rows;
  const matched = (await db.query(`SELECT v.id,v.colour,v."sourceData"->'dealertrade' AS "previousSource",s.colour_id FROM vehicles v JOIN colour_ids s ON v.id=s.id AND v."dealerId"=s.dealer WHERE v."sourceData"->'dealertrade'->>'vehicle_id'=s.id ORDER BY v.id FOR UPDATE OF v`)).rows;
  fs.writeFileSync(path.join(output,'before.json'),JSON.stringify(matched),{mode:0o600});
  let updated = 0;
  if (apply) updated = (await db.query(`UPDATE vehicles v SET "sourceData"=jsonb_set(v."sourceData",'{dealertrade,colour_id}',COALESCE(to_jsonb(s.colour_id),'null'::jsonb),true) FROM colour_ids s WHERE v.id=s.id AND v."dealerId"=s.dealer AND v."sourceData"->'dealertrade'->>'vehicle_id'=s.id AND v."sourceData"->'dealertrade'->'colour_id' IS DISTINCT FROM COALESCE(to_jsonb(s.colour_id),'null'::jsonb)`)).rowCount;
  let filledColours = 0;
  if (apply) filledColours = (await db.query(`UPDATE vehicles v SET colour=$1::jsonb->>s.colour_id::text FROM colour_ids s WHERE v.id=s.id AND v."dealerId"=s.dealer AND v."sourceData"->'dealertrade'->>'vehicle_id'=s.id AND v.colour IS NULL AND ($1::jsonb ? s.colour_id::text)`,[JSON.stringify(standardColours)])).rowCount;
  const after = (await db.query('SELECT id,colour FROM vehicles ORDER BY id')).rows;
  const afterMap = new Map(after.map(row => [row.id,row.colour]));
  for (const row of before) if (row.colour !== null && row.colour !== afterMap.get(row.id)) throw Error('Existing colour label changed');
  await db.query(apply?'COMMIT':'ROLLBACK');
  const report={mode:apply?'applied':'plan',sourceRows:rows.length,providedIds:source.length,matched:matched.length,updated,filledMissingStandardColours:filledColours,existingLabelsPreserved:true,totalVehicles:before.length,backup:path.join(output,'before.json')};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
 } catch(error) {await db.query('ROLLBACK').catch(()=>{});throw error;} finally {await db.end();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
