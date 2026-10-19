/** Atomic local database-name swap after staging validation. Keeps the previous database intact. */
const fs=require('node:fs'),path=require('node:path');require('dotenv').config({path:path.resolve(__dirname,'../.env'),quiet:true});const{Client}=require('pg');
const u=new URL(process.env.DATABASE_URL);if(u.hostname!=='127.0.0.1'||u.port!=='55432'||u.pathname!=='/changecars')throw Error('Local database only');
const directory=path.resolve(__dirname,'../.local/dealertrade-strict-refresh-20261019'),verification=JSON.parse(fs.readFileSync(path.join(directory,'stage-verification.json'),'utf8'));
if(!verification.sourceOnly||verification.inventory.wrong_ids||verification.inventory.legacy_data)throw Error('Successful stage verification required');
if(!fs.existsSync(path.join(directory,'stage-api-verification.json')))throw Error('Stage API smoke tests required');
const smoke=JSON.parse(fs.readFileSync(path.join(directory,'stage-api-verification.json'),'utf8'));if(smoke.result!=='PASS')throw Error('Stage API smoke tests failed');
const name=verification.stageDatabase,old='changecars_before_strict_'+Date.now();const quote=s=>'"'+s.replaceAll('"','""')+'"';
(async()=>{const live=new Client({connectionString:u.href});const su=new URL(u);su.pathname='/'+name;const stage=new Client({connectionString:su.href});await live.connect();await stage.connect();
try{await stage.query('BEGIN');await stage.query('DELETE FROM vehicle_view_daily');await stage.query('UPDATE vehicles SET "viewCount"=0,"enquiryCount"=0,"favouriteCount"=0,"popularityScore"=0');await stage.query('COMMIT');const q=`SELECT id,md5(to_jsonb(u)::text) fingerprint FROM users u ORDER BY id`;if(JSON.stringify((await live.query(q)).rows)!==JSON.stringify((await stage.query(q)).rows))throw Error('User account data changed since staging; refusing promotion');}finally{await live.end();await stage.end();}
const adminUrl=new URL(u);adminUrl.pathname='/postgres';const db=new Client({connectionString:adminUrl.href});await db.connect();try{
 await db.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=ANY($1::text[]) AND pid<>pg_backend_pid()`,[['changecars',name]]);
 await db.query('BEGIN');try{await db.query('ALTER DATABASE changecars RENAME TO '+quote(old));await db.query('ALTER DATABASE '+quote(name)+' RENAME TO changecars');await db.query('COMMIT');}catch(e){await db.query('ROLLBACK');throw e;}
 const report={promotedAt:new Date().toISOString(),database:'changecars',previousDatabase:old,backup:JSON.parse(fs.readFileSync(path.join(directory,'stage-preparation.json'),'utf8')).backup,verification,smokeTests:smoke.result};fs.writeFileSync(path.join(directory,'promotion-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({database:'changecars',previousDatabase:old,result:'PASS'}));
}finally{await db.end();}})().catch(e=>{console.error(e.message);process.exitCode=1});
