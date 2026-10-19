/** Refresh only DealerTrade WhatsApp fields in the local database; default is plan-only. */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const { Client } = require('pg');
const connection = new URL(process.env.DATABASE_URL);
if (connection.hostname !== '127.0.0.1' || connection.port !== '55432' || connection.pathname !== '/changecars') throw Error('Local ChangeCars database only');
const apply = process.argv.includes('--apply');
const directory = path.resolve(__dirname, '../.local/dealer-whatsapp', new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(directory, { recursive: true });
const token = process.env.DEALERTRADE_TOKEN || fs.readFileSync(path.resolve(__dirname, '../.local/dealertrade/token'), 'utf8').trim();
function fetchPage(page) {
  const result = spawnSync('curl', ['--config', '-', '--fail', '--silent', '--show-error', '--max-time', '45', '--header', 'Content-Type: application/json', '--header', 'Accept: application/json', '--data', '{"sources":[]}', `https://dealertrade.co.za/api/apk/dealers?page=${page}&per_page=100`], {
    input: 'header = ' + JSON.stringify('Authorization: Bearer ' + token) + '\n', encoding: 'utf8', maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) throw Error('DealerTrade request failed: ' + result.stderr);
  const value = JSON.parse(result.stdout);
  if (value.current_page !== page || !Array.isArray(value.data)) throw Error('Invalid dealer page');
  return value;
}
(async () => {
  const first = fetchPage(1), rows = [...first.data];
  console.log(`Dealer pages: 1/${first.last_page}`);
  for (let page = 2; page <= first.last_page; page++) {
    const value = fetchPage(page);
    if (value.total !== first.total) throw Error('Dealer inventory changed while paging; retry');
    rows.push(...value.data);
    console.log(`Dealer pages: ${page}/${first.last_page}`);
  }
  if (rows.length !== first.total || new Set(rows.map(row => String(row.dealer_id))).size !== rows.length) throw Error('Incomplete or duplicate dealer capture');
  if (rows.some(row => row.whatsapp_number != null && typeof row.whatsapp_number !== 'string')) throw Error('Invalid WhatsApp source field');
  fs.writeFileSync(path.join(directory, 'fetched-dealers.json'), JSON.stringify(rows));
  const data = rows.filter(row => Object.hasOwn(row, 'whatsapp_number')).map(row => ({ id: String(row.dealer_id), whatsapp: row.whatsapp_number ?? '' }));
  fs.writeFileSync(path.join(directory, 'fetched-whatsapp.json'), JSON.stringify(data, null, 2));
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await db.query('BEGIN');
    const ids = data.map(row => row.id);
    const dealers = (await db.query(`SELECT "externalId",payload ? 'whatsapp_number' AS "hadKey",payload->'whatsapp_number' AS "oldValue" FROM source_feed_records WHERE source='dealertrade' AND kind='dealer' AND "externalId"=ANY($1::text[]) FOR UPDATE`, [ids])).rows;
    const localIds = new Set(dealers.map(row => row.externalId));
    const matchedData = data.filter(row => localIds.has(row.id));
    if (!matchedData.length) throw Error('No matching local dealer identities');
    const vehicles = (await db.query(`SELECT id,"sourceData" ? 'dealertradeDealer' AS "hadDealerObject",("sourceData"->'dealertradeDealer') ? 'whatsapp_number' AS "hadKey","sourceData"->'dealertradeDealer'->'whatsapp_number' AS "oldValue" FROM vehicles WHERE "dealerId"=ANY($1::text[]) FOR UPDATE`, [matchedData.map(row => row.id)])).rows;
    fs.writeFileSync(path.join(directory, 'before.json'), JSON.stringify({ dealers, vehicles }, null, 2));
    let dealerUpdates = 0, vehicleUpdates = 0;
    if (apply) {
      const payload = JSON.stringify(matchedData);
      dealerUpdates = (await db.query(`UPDATE source_feed_records s SET payload=jsonb_set(s.payload,'{whatsapp_number}',to_jsonb(r.whatsapp),true) FROM jsonb_to_recordset($1::jsonb) AS r(id text,whatsapp text) WHERE s.source='dealertrade' AND s.kind='dealer' AND s."externalId"=r.id`, [payload])).rowCount;
      vehicleUpdates = (await db.query(`UPDATE vehicles v SET "sourceData"=jsonb_set(v."sourceData",'{dealertradeDealer}',COALESCE(NULLIF(v."sourceData"->'dealertradeDealer','null'::jsonb),'{}'::jsonb)||jsonb_build_object('whatsapp_number',r.whatsapp),true) FROM jsonb_to_recordset($1::jsonb) AS r(id text,whatsapp text) WHERE v."dealerId"=r.id`, [payload])).rowCount;
      const mismatch = (await db.query(`SELECT count(*)::int AS count FROM vehicles v JOIN jsonb_to_recordset($1::jsonb) AS r(id text,whatsapp text) ON v."dealerId"=r.id WHERE v."sourceData"->'dealertradeDealer'->>'whatsapp_number' IS DISTINCT FROM r.whatsapp`, [payload])).rows[0].count;
      if (mismatch || dealerUpdates !== matchedData.length || vehicleUpdates !== vehicles.length) throw Error('WhatsApp verification failed');
    }
    await db.query(apply ? 'COMMIT' : 'ROLLBACK');
    const report = { applied: apply, dealersFetched: rows.length, dealersWithWhatsappField: data.length, matchedLocalDealers: matchedData.length, skippedNonlocalDealers: data.length - matchedData.length, withNumber: matchedData.filter(row => row.whatsapp.trim()).length, emptyNumber: matchedData.filter(row => !row.whatsapp.trim()).length, dealerUpdates, vehicleUpdates, backupDirectory: directory, verified: apply };
    fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } catch (error) { await db.query('ROLLBACK'); throw error; }
  finally { await db.end(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
