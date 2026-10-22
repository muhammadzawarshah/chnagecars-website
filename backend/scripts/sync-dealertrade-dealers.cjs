/** Preserve complete fresh DealerTrade dealer payloads in the local database; --apply enables writes. */
const fs = require('node:fs'), path = require('node:path'), { spawnSync } = require('node:child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const { Client } = require('pg');
const url = new URL(process.env.DATABASE_URL);
if (url.hostname !== '127.0.0.1' || url.port !== '55432' || url.pathname !== '/changecars') throw Error('Local database only');
const directory = path.resolve(__dirname, '../.local/dealer-full-sync', new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(directory, { recursive: true });
const token = process.env.DEALERTRADE_TOKEN || fs.readFileSync(path.resolve(__dirname, '../.local/dealertrade/token'), 'utf8').trim();
function page(number) {
  const p = spawnSync('curl', ['--config', '-', '--fail', '--silent', '--show-error', '--max-time', '45', '--header', 'Content-Type: application/json', '--header', 'Accept: application/json', '--data', '{"sources":[]}', `https://dealertrade.co.za/api/apk/dealers?page=${number}&per_page=100`], { input: 'header = ' + JSON.stringify('Authorization: Bearer ' + token) + '\n', encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (p.status !== 0) throw Error(p.stderr);
  const result = JSON.parse(p.stdout);
  if (result.current_page !== number || !Array.isArray(result.data)) throw Error('Invalid dealer page');
  return result;
}

(async () => {
  const apply = process.argv.includes('--apply');
  const first = page(1), rows = [...first.data];
  console.log(`Dealer pages 1/${first.last_page}`);
  for (let i=2;i<=first.last_page;i++) {
    const result=page(i);
    if(result.total!==first.total)throw Error('Dealer total changed during traversal; retry');
    rows.push(...result.data);
    console.log(`Dealer pages ${i}/${first.last_page}`);
  }
  if(rows.length!==first.total||new Set(rows.map(r=>String(r.dealer_id))).size!==rows.length)throw Error('Incomplete or duplicate capture');
  if(rows.some(r=>!/^\d+$/.test(String(r.dealer_id))))throw Error('Invalid source dealer ID');
  fs.writeFileSync(path.join(directory,'dealers.json'),JSON.stringify(rows));
  const data=rows.map(r=>({id:String(r.dealer_id),payload:r})), payload=JSON.stringify(data), ids=data.map(r=>r.id);
  const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();
  try {
    await db.query('BEGIN');
    const sources=(await db.query(`SELECT * FROM source_feed_records WHERE source='dealertrade' AND kind='dealer' FOR UPDATE`)).rows;
    const dealers=(await db.query(`SELECT id,name,phone,email,address,description,"googleReviewUrl","hellopeterReviewUrl" FROM dealers WHERE id=ANY($1::text[]) FOR UPDATE`,[ids])).rows;
    const vehicles=(await db.query(`SELECT id,"dealerId","sourceData" ? 'dealertradeDealer' AS "hadKey","sourceData"->'dealertradeDealer' AS "oldDealerPayload" FROM vehicles WHERE "dealerId"=ANY($1::text[]) FOR UPDATE`,[ids])).rows;
    fs.writeFileSync(path.join(directory,'before.json'),JSON.stringify({sources,dealers,vehicles},null,2));
    const fieldChanges={}; const byId=new Map(rows.map(r=>[String(r.dealer_id),r]));
    const mapping={dealer_name:'name',telephone:'phone',email:'email',address:'address',description:'description',google_review:'googleReviewUrl',peter_review:'hellopeterReviewUrl'};
    for(const d of dealers) for(const [source,dest] of Object.entries(mapping)) if(typeof byId.get(d.id)[source]==='string'&&byId.get(d.id)[source]!==d[dest])fieldChanges[dest]=(fieldChanges[dest]||0)+1;
    let sourceUpdates=0,vehicleUpdates=0;
    if(apply) {
      sourceUpdates=(await db.query(`INSERT INTO source_feed_records(source,kind,"externalId",payload,"fetchedAt") SELECT 'dealertrade','dealer',r.id,r.payload,NOW() FROM jsonb_to_recordset($1::jsonb) AS r(id text,payload jsonb) ON CONFLICT(source,kind,"externalId") DO UPDATE SET payload=EXCLUDED.payload,"fetchedAt"=EXCLUDED."fetchedAt"`,[payload])).rowCount;
      for(const [source,dest] of Object.entries(mapping))await db.query(`UPDATE dealers d SET "${dest}"=r.payload->>'${source}' FROM jsonb_to_recordset($1::jsonb) AS r(id text,payload jsonb) WHERE d.id=r.id AND jsonb_typeof(r.payload->'${source}')='string' AND d."${dest}" IS DISTINCT FROM r.payload->>'${source}'`,[payload]);
      vehicleUpdates=(await db.query(`UPDATE vehicles v SET "sourceData"=jsonb_set(COALESCE(v."sourceData",'{}'::jsonb),'{dealertradeDealer}',r.payload,true) FROM jsonb_to_recordset($1::jsonb) AS r(id text,payload jsonb) WHERE v."dealerId"=r.id`,[payload])).rowCount;
      const mismatch=(await db.query(`SELECT (SELECT count(*) FROM jsonb_to_recordset($1::jsonb) AS r(id text,payload jsonb) LEFT JOIN source_feed_records s ON s.source='dealertrade' AND s.kind='dealer' AND s."externalId"=r.id WHERE s.payload IS DISTINCT FROM r.payload)::int AS source,(SELECT count(*) FROM vehicles v JOIN jsonb_to_recordset($1::jsonb) AS r(id text,payload jsonb) ON v."dealerId"=r.id WHERE v."sourceData"->'dealertradeDealer' IS DISTINCT FROM r.payload)::int AS vehicles`,[payload])).rows[0];
      if(mismatch.source||mismatch.vehicles||sourceUpdates!==rows.length||vehicleUpdates!==vehicles.length)throw Error('Exact JSON verification failed');
      for(const [source,dest]of Object.entries(mapping)){
        const count=(await db.query(`SELECT count(*)::int AS count FROM dealers d JOIN jsonb_to_recordset($1::jsonb) AS r(id text,payload jsonb) ON d.id=r.id WHERE jsonb_typeof(r.payload->'${source}')='string' AND d."${dest}" IS DISTINCT FROM r.payload->>'${source}'`,[payload])).rows[0].count;
        if(count)throw Error('Dealer field verification failed: '+dest);
      }
    }
    await db.query(apply?'COMMIT':'ROLLBACK');
    const report={applied:apply,sourceDealers:rows.length,existingDealers:dealers.length,additionalSourceSnapshots:rows.length-dealers.length,sourceUpdates,vehicleUpdates,fieldChanges,withWhatsapp:rows.filter(r=>typeof r.whatsapp_number==='string'&&r.whatsapp_number.trim()).length,existingWithWhatsapp:dealers.filter(d=>typeof byId.get(d.id).whatsapp_number==='string'&&byId.get(d.id).whatsapp_number.trim()).length,allSourceFields:[...new Set(rows.flatMap(Object.keys))].sort(),exactPayloadVerification:apply?'PASS':'PLAN',directory};
    fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  }catch(error){await db.query('ROLLBACK');throw error;}finally{await db.end();}
})().catch(error=>{console.error(error.message);process.exitCode=1});
