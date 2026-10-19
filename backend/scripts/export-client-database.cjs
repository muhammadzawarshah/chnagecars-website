/** Export the current cleaned local database and test a full restore in a separate temporary database. */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
require('dotenv').config({path:path.resolve(__dirname,'../.env'),quiet:true});
const {Client}=require('pg');
const url=new URL(process.env.DATABASE_URL);
if(url.hostname!=='127.0.0.1'||url.port!=='55432'||url.pathname!=='/changecars')throw Error('Export is restricted to the cleaned local ChangeCars database');
const timestamp=new Date().toISOString().replace(/[:.]/g,'-');
const directory=path.resolve(__dirname,'../../client-handover',`changecars-clean-${timestamp}`);
fs.mkdirSync(directory,{recursive:true});
const dumpName='changecars-clean.dump';
const dumpPath=path.join(directory,dumpName);
const verificationDb=`changecars_handover_${Date.now()}`;
const env={...process.env,PGPASSWORD:decodeURIComponent(url.password)};
const args=['-h','127.0.0.1','-p','55432','-U',decodeURIComponent(url.username)];
const quote=value=>'"'+value.replace(/"/g,'""')+'"';
function command(binary,arguments_){const result=spawnSync(binary,arguments_,{env,encoding:'utf8',maxBuffer:20*1024*1024});if(result.status!==0)throw Error(`${binary} failed: ${(result.stderr||result.error?.message||'').slice(0,2000)}`);return result.stdout;}
async function summary(db){
 const tables=(await db.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`)).rows;
 const counts={};for(const {tablename}of tables)counts[tablename]=Number((await db.query(`SELECT count(*) count FROM public.${quote(tablename)}`)).rows[0].count);
 const statuses=(await db.query(`SELECT status,count(*)::int count FROM vehicles GROUP BY status ORDER BY status`)).rows;
 const sources=(await db.query(`SELECT count(*)::int total, count(*) FILTER(WHERE "sourceData"->'dealertrade'->>'vehicle_id' IS NOT NULL)::int dealertrade, count(*) FILTER(WHERE "sourceData"->>'vehicle_id' IS NOT NULL AND "sourceData"->'dealertrade'->>'vehicle_id' IS NULL)::int fbookOnly, count(*) FILTER(WHERE status='ARCHIVED')::int archived,count(*) FILTER(WHERE id::text="sourceData"->'dealertrade'->>'vehicle_id')::int original_vehicle_ids,count(*) FILTER(WHERE "dealerId"::text="sourceData"->'dealertrade'->>'dealer_id')::int original_dealer_links FROM vehicles`)).rows[0];
 return {tables:counts,vehicleStatuses:statuses,vehicleSources:sources};
}
(async()=>{
 const source=new Client({connectionString:process.env.DATABASE_URL});await source.connect();let created=false;
 try{
  await source.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const snapshot=(await source.query('SELECT pg_export_snapshot() snapshot')).rows[0].snapshot;
  const original=await summary(source);
  if(original.vehicleSources.fbookonly!==0||original.vehicleSources.archived!==0)throw Error('Source still contains Fbook-only or archived listings');
  if(original.vehicleSources.original_vehicle_ids!==original.vehicleSources.total||original.vehicleSources.original_dealer_links!==original.vehicleSources.total)throw Error('Actual primary IDs must match original DealerTrade IDs before client export');
  command('pg_dump',[...args,'-d','changecars','--format=custom','--no-owner','--no-acl',`--snapshot=${snapshot}`,'--file',dumpPath]);
  const contents=command('pg_restore',['--list',dumpPath]);fs.writeFileSync(path.join(directory,'backup-contents.txt'),contents);
  await source.query('COMMIT');
  console.log(JSON.stringify({backupCreated:dumpPath,bytes:fs.statSync(dumpPath).size,vehicles:original.vehicleSources}));
  await source.query(`CREATE DATABASE ${quote(verificationDb)}`);created=true;
  command('pg_restore',[...args,'--dbname',verificationDb,'--no-owner','--no-acl','--exit-on-error','--single-transaction',dumpPath]);
  const verifyUrl=new URL(url);verifyUrl.pathname='/'+verificationDb;
  const restored=new Client({connectionString:verifyUrl.toString()});await restored.connect();
  let verified;try{verified=await summary(restored);}finally{await restored.end();}
  if(JSON.stringify(original)!==JSON.stringify(verified))throw Error('Restored database counts differ from the export snapshot');
  const hash=crypto.createHash('sha256').update(fs.readFileSync(dumpPath)).digest('hex');
  fs.writeFileSync(path.join(directory,'SHA256SUMS'),`${hash}  ${dumpName}\n`);
  fs.writeFileSync(path.join(directory,'database-summary.json'),JSON.stringify(original,null,2)+'\n');
  fs.writeFileSync(path.join(directory,'restore-verification.json'),JSON.stringify({result:'PASS',verifiedAt:new Date().toISOString(),method:'Full restore to a separate temporary local PostgreSQL database; every public table row count and vehicle status/source count matched the consistent export snapshot',tableCount:Object.keys(original.tables).length,vehicles:verified.vehicleSources,sha256:hash},null,2)+'\n');
  fs.writeFileSync(path.join(directory,'README.md'),`# ChangeCars cleaned database — client handover\n\nCreated ${new Date().toISOString()}. Full PostgreSQL custom-format database backup (schema, migrations and data), exported from the cleaned local installation.\n\n## Inventory\n\n- ${original.vehicleSources.total.toLocaleString('en-US')} vehicles, all with DealerTrade source data.\n- Zero Fbook-only vehicles.\n- Zero archived vehicles.\n- Names, existing internal IDs, original source IDs and dealer relationships preserved.\n- The actual vehicles.id and dealers.id database primary keys now use original DealerTrade IDs (text/numeric strings), with all related foreign keys updated. Use the matching updated backend and Prisma schema, which support these text IDs.\n- Full table counts and status counts are in database-summary.json.\n\n## Restore into a NEW empty database\n\nRequires PostgreSQL 17 or newer with pg_trgm available. Use matching/newer pg_restore tools. Set PGHOST, PGPORT and PGUSER for the client's server; supply the password using a secure prompt or .pgpass. No connection passwords are included in this package.\n\n\`\`\`sh\nshasum -a 256 -c SHA256SUMS\ncreatedb -h YOUR_DB_HOST -p 5432 -U YOUR_DB_USER changecars\npg_restore -h YOUR_DB_HOST -p 5432 -U YOUR_DB_USER --dbname changecars --no-owner --no-acl --exit-on-error --single-transaction changecars-clean.dump\n\`\`\`\n\nPoint the matching backend's DATABASE_URL at the restored database. For a new application installation, configure application secrets separately. Existing application user/account data is included: handle this package as private client data and use an authorized transfer method.\n\nUse an empty database. Do not restore over an existing database without taking its backup first. This package contains the current cleaned database; it does not include the previously removed archived records. Their separate recovery backup remains in the original project's local archived-backups directory.\n\n## Verification\n\nThe dump was restored successfully to a separate temporary local database. Every public table's row count and vehicle source/status totals matched the export snapshot. See restore-verification.json. The source was not replaced or modified.\n\n## Media\n\nThis package is the database only. It stores image URLs and metadata, not local image files or storage objects. Copy the project's public/media assets or configure the same object-storage access separately if needed.\n\nFiles: changecars-clean.dump, SHA256SUMS, backup-contents.txt, database-summary.json, restore-verification.json, README.md.\n`);
  console.log(JSON.stringify({verification:'PASS',tables:Object.keys(original.tables).length,vehicles:verified.vehicleSources,directory}));
 }finally{
  try{await source.query('ROLLBACK');}catch{}
  if(created)await source.query(`DROP DATABASE ${quote(verificationDb)}`);
  await source.end();
 }
})().catch(error=>{console.error(error.message);process.exitCode=1});
