/** Prepare an isolated full restore and clean inventory for a source-only rebuild. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
require('dotenv').config({path:path.resolve(__dirname,'../.env'),quiet:true});const{Client}=require('pg');
const u=new URL(process.env.DATABASE_URL);if(u.hostname!=='127.0.0.1'||u.port!=='55432'||u.pathname!=='/changecars')throw Error('Local source database only');
const directory=path.resolve(__dirname,'../.local/dealertrade-strict-refresh-20261019');fs.mkdirSync(directory,{recursive:true});
const backup=path.resolve(__dirname,'../../client-handover/changecars-clean-2026-10-19T11-54-54-387Z/changecars-clean.dump');
const verification=JSON.parse(fs.readFileSync(path.join(path.dirname(backup),'restore-verification.json')));if(verification.result!=='PASS')throw Error('Verified backup required');
const name='changecars_strict_stage_20261019';const quote=s=>'"'+s.replaceAll('"','""')+'"';
(async()=>{const c=new Client({connectionString:u.href});await c.connect();try{
 if((await c.query('SELECT 1 FROM pg_database WHERE datname=$1',[name])).rowCount)throw Error('Stage already exists; refusing replacement');
 await c.query('CREATE DATABASE '+quote(name));
 const r=spawnSync('pg_restore',['-h',u.hostname,'-p',u.port,'-U',decodeURIComponent(u.username),'-d',name,'--no-owner','--no-acl','--exit-on-error','--single-transaction',backup],{env:{...process.env,PGPASSWORD:decodeURIComponent(u.password)},encoding:'utf8',maxBuffer:2*1024*1024});if(r.status!==0)throw Error(r.stderr);
 const stageUrl=new URL(u);stageUrl.pathname='/'+name;const s=new Client({connectionString:stageUrl.href});await s.connect();try{
  const members=(await s.query('SELECT * FROM dealer_members')).rows;fs.writeFileSync(path.join(directory,'preserved-memberships.json'),JSON.stringify(members,null,2));
  const slugs=(await s.query('SELECT id,slug FROM vehicles')).rows;fs.writeFileSync(path.join(directory,'preserved-slugs.json'),JSON.stringify(slugs));
  await s.query('BEGIN');
  const deletedVehicles=(await s.query('DELETE FROM vehicles')).rowCount;
  const deletedDealers=(await s.query('DELETE FROM dealers')).rowCount;
  await s.query("DELETE FROM source_feed_records WHERE kind IN ('dealer','vehicle')");
  await s.query('COMMIT');
  const report={stageDatabase:name,backup,deletedVehicles,deletedDealers,preservedUserCount:(await s.query('SELECT count(*)::int n FROM users')).rows[0].n,productionDatabaseModified:false};fs.writeFileSync(path.join(directory,'stage-preparation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await s.end();}
}finally{await c.end();}})().catch(e=>{console.error(e.message);process.exitCode=1});
