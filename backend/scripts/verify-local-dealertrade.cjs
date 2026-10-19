const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
require('dotenv').config({path:path.resolve(__dirname,'../.env'),quiet:true});
const {Client} = require('pg');
const url = new URL(process.env.DATABASE_URL);
if(url.hostname!=='127.0.0.1'||url.port!=='55432') throw Error('Local database only');
const origin='http://127.0.0.1:4000/api/v1';
const results=[];
(async()=>{
 const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();
 try {
  const query=await db.query(`SELECT v.id, v.slug, v.title, v."dealerId",v."sourceData"->'dealertrade'->>'vehicle_id' AS "sourceId",v."sourceData"->'dealertrade'->>'dealer_id' AS "sourceDealerId",d.name AS "dealerName" FROM vehicles v JOIN dealers d ON d.id=v."dealerId" WHERE v.status='PUBLISHED' AND d.status='APPROVED' AND v."sourceData"->'dealertrade'->>'vehicle_id' IS NOT NULL ORDER BY v.id LIMIT 25`);
  const rows=query.rows;if(rows.length<2) throw Error('Need at least two DealerTrade listings');
  const a=rows[0], b=rows[1];
  async function request(p){const r=await fetch(origin+p,{signal:AbortSignal.timeout(30000)});const body=await r.json();assert.equal(r.status,200,`${p}: ${JSON.stringify(body)}`);return body;}
  async function check(name,fn){try{const response=await fn();results.push({name,status:'PASS',response});console.log(JSON.stringify(results.at(-1)));}catch(error){results.push({name,status:'FAIL',response:error.message});console.log(JSON.stringify(results.at(-1)));}}
  await check('Database primary IDs exactly match DealerTrade source IDs',async()=>{const x=(await db.query(`SELECT count(*)::int total,count(*) FILTER(WHERE id::text="sourceData"->'dealertrade'->>'vehicle_id' AND "dealerId"::text="sourceData"->'dealertrade'->>'dealer_id')::int matching FROM vehicles`)).rows[0];assert.equal(x.total,x.matching);return x;});
  await check('Fbook-only rows permanently removed',async()=>{
   const r=(await db.query(`SELECT count(*) count FROM vehicles WHERE "sourceData"->>'vehicle_id' IS NOT NULL AND "sourceData"->'dealertrade'->>'vehicle_id' IS NULL`)).rows[0];assert.equal(r.count,'0');return '0 Fbook-only vehicles';
  });
  await check('Public results use original vehicle/dealer IDs',async()=>{
   const x=await request('/vehicles?pageSize=50');assert(x.data.length);for(const v of x.data){assert.match(v.id,/^\d+$/);assert.equal(v.id,v.sourceVehicleId);assert.match(v.dealer.id,/^\d+$/);assert(!('sourceData' in v));}return {checked:x.data.length,total:x.meta.total};
  });
  await check('25 detail responses match correct stored DealerTrade identities and names',async()=>{
   for(const row of rows){const v=await request('/vehicles/'+row.sourceId);assert.equal(v.id,row.sourceId);assert.equal(v.dealer.id,row.sourceDealerId);assert.equal(v.title,row.title);assert.equal(v.dealer.name,row.dealerName);}return '25/25 exact IDs, dealer links, titles and names';
  });
  await check('Existing vehicle slug remains valid',async()=>{const v=await request('/vehicles/'+a.slug);assert.equal(v.id,a.sourceId);return v.id;});
  await check('Existing internal UUID lookup remains compatible',async()=>{const legacy=(await db.query(`SELECT "legacyId" FROM dealertrade_id_aliases WHERE entity='vehicle' AND "sourceId"=$1 LIMIT 1`,[a.sourceId])).rows[0]?.legacyId;assert(legacy);const v=await request('/vehicles/'+legacy);assert.equal(v.id,a.sourceId);return v.id;});
  await check('Website adapter accepts and returns original IDs',async()=>{const v=await request('/web/cars/'+a.sourceId);assert.equal(v.id,a.sourceId);assert.equal(v.dealer.id,a.sourceDealerId);assert.equal(v.title,a.title);return {id:v.id,dealerId:v.dealer.id};});
  await check('Compare accepts original IDs',async()=>{const x=await request('/vehicles/compare?ids='+a.sourceId+','+b.sourceId);assert.deepEqual(x.items.map(v=>v.id),[a.sourceId,b.sourceId]);return x.items.map(v=>v.id);});
  await check('Similar accepts original ID',async()=>{const x=await request('/vehicles/'+a.sourceId+'/similar');for(const v of x)assert.match(v.id,/^\d+$/);return {count:x.length};});
  await check('Same dealer accepts original ID',async()=>{const x=await request('/vehicles/'+a.sourceId+'/dealer-vehicles');for(const v of x)assert.equal(v.dealer.id,a.sourceDealerId);return {count:x.length,dealerId:a.sourceDealerId};});
  await check('Market-price accepts original ID',async()=>{await request('/vehicles/'+a.sourceId+'/market-price');return 'HTTP 200';});
  await check('Dealer detail uses original ID and name',async()=>{const d=await request('/dealers/'+a.sourceDealerId);assert.equal(d.id,a.sourceDealerId);assert.equal(d.name,a.dealerName);return {id:d.id,name:d.name};});
  await check('Dealer directory contains only DealerTrade identities',async()=>{const d=await request('/dealers?pageSize=50');for(const row of d.data)assert.match(row.id,/^\d+$/);return {checked:d.data.length,total:d.meta.total};});
  await check('Filter stock by original dealer ID',async()=>{const x=await request('/vehicles?dealer='+a.sourceDealerId+'&pageSize=50');assert(x.data.length);for(const v of x.data)assert.equal(v.dealer.id,a.sourceDealerId);return {dealerId:a.sourceDealerId,count:x.meta.total};});
  await check('Count and list agree after Fbook removal',async()=>{const x=await request('/vehicles/count');const y=await request('/vehicles?pageSize=1');assert.equal(x.total,y.meta.total);return {total:x.total};});
  await check('Unknown source ID does not resolve to another listing',async()=>{const r=await fetch(origin+'/vehicles/999999999999999');assert.equal(r.status,404);return 'HTTP 404';});
  const dir=path.resolve(__dirname,'../.local/dealertrade-only');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'api-verification.json'),JSON.stringify({origin,results},null,2)+'\n');
  if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
 }finally{await db.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1});
