/** Import a verified fresh feed into the isolated empty local rebuild database. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
require('dotenv').config({path:path.resolve(__dirname,'../.env'),quiet:true});const{Client}=require('pg');
const u=new URL(process.env.DATABASE_URL);if(u.hostname!=='127.0.0.1'||u.port!=='55432'||u.pathname!=='/changecars')throw Error('Local database only');
const directory=path.resolve(__dirname,'../.local/dealertrade-strict-refresh-20261019');const stage=new URL(u);stage.pathname='/changecars_strict_stage_20261019';
(async()=>{
 const fetch=JSON.parse(fs.readFileSync(path.join(directory,'fetch-report.json'),'utf8'));
 for(const [name,hash]of [['vehicles',fetch.vehiclesSha256],['dealers',fetch.dealersSha256]]){const bytes=fs.readFileSync(path.join(directory,name+'.json'));if(hash && crypto.createHash('sha256').update(bytes).digest('hex')!==hash)throw Error('Source capture hash mismatch');}
 const dealerRows=JSON.parse(fs.readFileSync(path.join(directory,'dealers.json'),'utf8'));if(dealerRows.length!==fetch.dealerRows||new Set(dealerRows.map(r=>String(r.dealer_id))).size!==dealerRows.length)throw Error('Invalid dealer capture');
 if(fetch.partitionsCompleted<1)throw Error('Incomplete source capture');
 fs.copyFileSync(path.join(directory,'vehicles.json'),path.join(directory,'stock-all.json'));fs.copyFileSync(path.join(directory,'dealers.json'),path.join(directory,'dealers-all.json'));
 const identityDb=new Client({connectionString:u.href});await identityDb.connect();try{await identityDb.query('BEGIN READ ONLY');fs.writeFileSync(path.join(directory,'preserved-dealer-slugs.json'),JSON.stringify((await identityDb.query('SELECT id,slug FROM dealers')).rows));await identityDb.query('ROLLBACK');}finally{await identityDb.end();}
 const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['--import','tsx','prisma/import-dealertrade.ts'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,DATABASE_URL:stage.href,DEALERTRADE_IMPORT_DIR:directory,DEALERTRADE_STRICT_SOURCE:'1'},stdio:'inherit'});child.on('error',reject);child.on('exit',resolve)});
 if(code!==0)throw Error('Strict stage import failed; current app database unchanged');
 const report=JSON.parse(fs.readFileSync(path.join(directory,'import-report.json'),'utf8'));if(report.failures.length)throw Error('Import reported failures');
 const db=new Client({connectionString:stage.href});await db.connect();try{
  await db.query('BEGIN');
  await db.query('DELETE FROM vehicle_filter_snapshots');
  const members=JSON.parse(fs.readFileSync(path.join(directory,'preserved-memberships.json'),'utf8'));
  let restoredMemberships=0;
  for(const m of members){if(!(await db.query('SELECT 1 FROM dealers WHERE id=$1',[m.dealerId])).rowCount)continue;const branch=m.branchId&&(await db.query('SELECT 1 FROM branches WHERE id=$1',[m.branchId])).rowCount?m.branchId:null;await db.query(`INSERT INTO dealer_members SELECT * FROM jsonb_populate_record(NULL::dealer_members,$1::jsonb) ON CONFLICT(id) DO NOTHING`,[JSON.stringify({...m,branchId:branch})]);restoredMemberships++;}
  const counts=(await db.query(`SELECT count(*)::int total,count(*) FILTER(WHERE id<>"sourceData"->'dealertrade'->>'vehicle_id' OR "dealerId"<>"sourceData"->'dealertrade'->>'dealer_id')::int wrong_ids,count(*) FILTER(WHERE year IS NOT NULL)::int years,count(*) FILTER(WHERE colour IS NOT NULL)::int colours,count(*) FILTER(WHERE latitude IS NOT NULL OR longitude IS NOT NULL)::int coordinates,count(*) FILTER(WHERE vin IS NOT NULL OR "registrationNumber" IS NOT NULL)::int private_identifiers,count(*) FILTER(WHERE "sourceData" ? 'exterior_color' OR "sourceData" ? 'body_style' OR "sourceData" ? 'year')::int legacy_data,count(*) FILTER(WHERE "sourceData"->>'importPolicy' IS DISTINCT FROM 'dealertrade-only')::int wrong_policy FROM vehicles`)).rows[0];
  if(counts.total!==report.imported||counts.wrong_ids||counts.legacy_data||counts.wrong_policy)throw Error('Strict stage identity/source verification failed');
  const raw=(await db.query(`SELECT kind,count(*)::int count FROM source_feed_records GROUP BY kind`)).rows;
  if(raw.find(r=>r.kind==='vehicle')?.count!==fetch.uniqueVehicleRows||raw.find(r=>r.kind==='dealer')?.count!==fetch.dealerRows)throw Error('Not all fresh source payloads preserved');
  const users=(await db.query('SELECT count(*)::int n FROM users')).rows[0].n;if(users!==JSON.parse(fs.readFileSync(path.join(directory,'stage-preparation.json'),'utf8')).preservedUserCount)throw Error('User account count changed');
  await db.query('COMMIT');
  const result={stageDatabase:stage.pathname.slice(1),raw,inventory:counts,restoredMemberships,skippedMemberships:members.length-restoredMemberships,userAccounts:users,sourceOnly:true,currentAppDatabaseModified:false,rawOnlyVehicleCount:fetch.uniqueVehicleRows-counts.total};
  fs.writeFileSync(path.join(directory,'stage-verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }catch(e){await db.query('ROLLBACK');throw e;}finally{await db.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1});
