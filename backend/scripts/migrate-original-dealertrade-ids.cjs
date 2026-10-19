/** Apply the reviewed source-primary-key migration to the local database only, after a verified full backup. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
require('dotenv').config({path:path.resolve(__dirname,'../.env'),quiet:true});
const {Client}=require('pg');const url=new URL(process.env.DATABASE_URL);
if(url.hostname!=='127.0.0.1'||url.port!=='55432'||url.pathname!=='/changecars')throw Error('Local database only');
(async()=>{const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();try{
 const directory=path.resolve(__dirname,'../.local/original-dealertrade-ids',new Date().toISOString().replace(/[:.]/g,'-'));fs.mkdirSync(directory,{recursive:true});
 const dump=path.join(directory,'before-id-migration.dump');const env={...process.env,PGPASSWORD:decodeURIComponent(url.password)};
 let r=spawnSync('pg_dump',['-h','127.0.0.1','-p','55432','-U',decodeURIComponent(url.username),'-d','changecars','-Fc','--no-owner','--no-acl','-f',dump],{env,encoding:'utf8'});
 if(r.status!==0||!fs.existsSync(dump)||fs.statSync(dump).size<1000)throw Error('Backup failed');
 r=spawnSync('pg_restore',['--list',dump],{encoding:'utf8'});if(r.status!==0||!r.stdout.includes('TABLE DATA public vehicles'))throw Error('Backup verification failed');
 const before=(await db.query(`SELECT (SELECT count(*)::int FROM vehicles) vehicles,(SELECT count(*)::int FROM dealers) dealers,(SELECT count(*)::int FROM vehicle_images) images`)).rows[0];
 await db.query(fs.readFileSync(path.resolve(__dirname,'../prisma/migrations/20261019000100_original_dealertrade_primary_ids/migration.sql'),'utf8'));
 const after=(await db.query(`SELECT (SELECT count(*)::int FROM vehicles) vehicles,(SELECT count(*)::int FROM dealers) dealers,(SELECT count(*)::int FROM vehicle_images) images`)).rows[0];
 const ids=(await db.query(`SELECT count(*)::int total,count(*) FILTER(WHERE id="sourceData"->'dealertrade'->>'vehicle_id')::int original_vehicle_ids,count(*) FILTER(WHERE "dealerId"="sourceData"->'dealertrade'->>'dealer_id')::int original_dealer_links FROM vehicles`)).rows[0];
 const report={backup:dump,before,after,ids};fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 if(JSON.stringify(before)!==JSON.stringify(after)||ids.total!==ids.original_vehicle_ids||ids.total!==ids.original_dealer_links)throw Error('Post-migration check failed');
}finally{await db.end()}})().catch(e=>{console.error(e.message);process.exitCode=1});
