/** Read fresh DealerTrade dealer pages and compare exact source formatting against local data. */
const fs = require('node:fs'), path = require('node:path'), { spawnSync } = require('node:child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const { Client } = require('pg');
const url = new URL(process.env.DATABASE_URL);
if (url.hostname !== '127.0.0.1' || url.port !== '55432' || url.pathname !== '/changecars') throw Error('Local database only');
const directory = path.resolve(__dirname, '../.local/dealer-format', new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(directory, { recursive: true });
const token = process.env.DEALERTRADE_TOKEN || fs.readFileSync(path.resolve(__dirname, '../.local/dealertrade/token'), 'utf8').trim();
function page(number) {
  const p = spawnSync('curl', ['--config', '-', '--fail', '--silent', '--show-error', '--max-time', '45', '--header', 'Content-Type: application/json', '--header', 'Accept: application/json', '--data', '{"sources":[]}', `https://dealertrade.co.za/api/apk/dealers?page=${number}&per_page=100`], { input: 'header = ' + JSON.stringify('Authorization: Bearer ' + token) + '\n', encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (p.status !== 0) throw Error(p.stderr);
  const result = JSON.parse(p.stdout);
  if (result.current_page !== number || !Array.isArray(result.data)) throw Error('Invalid dealer page');
  return result;
}
const canonical = value => JSON.stringify(value && typeof value === 'object' ? Array.isArray(value) ? value.map(v => JSON.parse(canonical(v))) : Object.fromEntries(Object.keys(value).sort().map(k => [k, JSON.parse(canonical(value[k]))])) : value);
(async () => {
  const first = page(1), rows = [...first.data];
  console.log(`Fetched dealer page 1/${first.last_page}`);
  for (let i = 2; i <= first.last_page; i++) {
    const result = page(i);
    if (result.total !== first.total) throw Error('Source total changed; retry');
    rows.push(...result.data);
    console.log(`Fetched dealer page ${i}/${first.last_page}`);
  }
  if (rows.length !== first.total || new Set(rows.map(r => String(r.dealer_id))).size !== rows.length) throw Error('Incomplete dealer traversal');
  fs.writeFileSync(path.join(directory, 'dealers.json'), JSON.stringify(rows));
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const dealers = (await db.query('SELECT id,name,phone,email,address,description,city,province FROM dealers')).rows;
    const raw = (await db.query("SELECT \"externalId\",payload FROM source_feed_records WHERE source='dealertrade' AND kind='dealer'")).rows;
    const dealerMap = new Map(dealers.map(r => [r.id,r])), sourceMap = new Map(raw.map(r => [r.externalId,r.payload]));
    const fields = {}, sourceFields = {}, examples = [], unknownIds = [];
    let matched = 0;
    const mapping = { dealer_name:'name', telephone:'phone', email:'email', address:'address', description:'description' };
    for (const row of rows) {
      const id = String(row.dealer_id), local = dealerMap.get(id), old = sourceMap.get(id);
      if (!local) { unknownIds.push(id); continue; }
      matched++;
      for (const [source, dest] of Object.entries(mapping)) {
        if (row[source] !== local[dest]) {
          fields[dest] = (fields[dest] || 0) + 1;
          if (examples.length < 12 && ['name','address'].includes(dest)) examples.push({ id, field:dest, database:local[dest], api:row[source] });
        }
      }
      for (const key of Object.keys(row)) if (!old || !Object.hasOwn(old,key) || canonical(row[key]) !== canonical(old[key])) sourceFields[key] = (sourceFields[key] || 0) + 1;
    }
    const report = { checkedAt:new Date().toISOString(), sourceDealers:rows.length, matchedLocalDealers:matched, localDealersMissingFromSource:dealers.filter(d => /^\d+$/.test(d.id) && !rows.some(r => String(r.dealer_id) === d.id)).map(d => d.id), newDealerIdsNotImported:unknownIds, databaseFieldDifferences:fields, rawPayloadFieldDifferences:sourceFields, examples, directory, databaseModified:false };
    fs.writeFileSync(path.join(directory, 'audit.json'), JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
    await db.query('ROLLBACK');
  } finally { await db.end(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
