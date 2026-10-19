/** Back up, rehearse restoration, then delete ARCHIVED vehicles in this project's LOCAL database only. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
require('dotenv').config({path:path.resolve(__dirname,'../.env'),quiet:true});
const {Client} = require('pg');
const {archivedRestoreIds} = require('./archived-restore-ids.cjs');
const url = new URL(process.env.DATABASE_URL);
if(url.hostname!=='127.0.0.1'||url.port!=='55432'||url.pathname!=='/changecars') throw Error('Only 127.0.0.1:55432/changecars is allowed');
const root=path.resolve(__dirname,'../.local/archived-backups');
const quote=s=>'"'+s.replace(/"/g,'""')+'"';
const literal=s=>"'"+s.replace(/'/g,"''")+"'";
const checksum=text=>crypto.createHash('sha256').update(text).digest('hex');
(async()=>{
 const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();
 try{
  const restoreIndex=process.argv.indexOf('--restore');
  if(restoreIndex>=0){
   const directory=path.resolve(process.argv[restoreIndex+1]||'');
   if(!directory.startsWith(root+path.sep))throw Error('Restore requires one of this script’s local backup directories');
   const manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'),'utf8'));
   const sql=fs.readFileSync(path.join(directory,'restore.sql'),'utf8');
   if(checksum(sql)!==manifest.restoreSha256)throw Error('Restore checksum mismatch');
   await db.query(await archivedRestoreIds(db, sql));
   console.log(JSON.stringify({restoredVehicles:manifest.archivedVehicles,backup:directory}));return;
  }
  const before=(await db.query(`SELECT status,count(*)::int count FROM vehicles GROUP BY status ORDER BY status`)).rows;
  const archived=before.find(r=>r.status==='ARCHIVED')?.count??0;
  if(!process.argv.includes('--apply')){console.log(JSON.stringify({mode:'plan',archivedVehicles:archived,statusCounts:before}));return;}
  if(!archived){console.log('No archived vehicles to delete');return;}
  const directory=path.join(root,new Date().toISOString().replace(/[:.]/g,'-'));fs.mkdirSync(directory,{recursive:true});
  const dump=path.join(directory,'full-before-delete.dump');
  const result=spawnSync('pg_dump',['-h','127.0.0.1','-p','55432','-U',decodeURIComponent(url.username),'-d','changecars','-Fc','-f',dump],{env:{...process.env,PGPASSWORD:decodeURIComponent(url.password)},encoding:'utf8'});
  if(result.status!==0||!fs.existsSync(dump)||fs.statSync(dump).size<1000)throw Error('Full backup failed; deletion refused');
  const list=spawnSync('pg_restore',['--list',dump],{encoding:'utf8'});
  if(list.status!==0||!list.stdout.includes('TABLE DATA public vehicles'))throw Error('Full backup could not be verified');
  await db.query('BEGIN');
  try{
   const dependencies=(await db.query(`SELECT ns.nspname schema,cl.relname name,att.attname column,c.confdeltype action FROM pg_constraint c JOIN pg_class cl ON cl.oid=c.conrelid JOIN pg_namespace ns ON ns.oid=cl.relnamespace JOIN pg_attribute att ON att.attrelid=c.conrelid AND att.attnum=c.conkey[1] WHERE c.contype='f' AND c.confrelid='vehicles'::regclass AND array_length(c.conkey,1)=1 ORDER BY cl.relname`)).rows;
   if(dependencies.some(r=>!['c','n'].includes(r.action)))throw Error('Unexpected restrictive vehicle dependency; deletion refused');
   await db.query(`LOCK TABLE public.vehicles,${dependencies.map(r=>`${quote(r.schema)}.${quote(r.name)}`).join(',')} IN SHARE ROW EXCLUSIVE MODE`);
   await db.query(`CREATE TEMP TABLE archived_targets ON COMMIT DROP AS SELECT id FROM vehicles WHERE status='ARCHIVED'`);
   await db.query(`CREATE TEMP TABLE preserved_active ON COMMIT DROP AS SELECT id,md5(to_jsonb(v)::text) fingerprint FROM vehicles v WHERE status<>'ARCHIVED'`);
   const tables=[{schema:'public',name:'vehicles',column:'id',action:'parent'},...dependencies];
   const counts={},statements=[],data={};
   for(const table of tables){
    const name=`${quote(table.schema)}.${quote(table.name)}`;
    const json=(await db.query(`SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb)::text data FROM ${name} t WHERE t.${quote(table.column)} IN (SELECT id FROM archived_targets)`)).rows[0].data;
    data[table.name]=json;counts[table.name]=JSON.parse(json).length;
    if(!counts[table.name])continue;
    const records=`jsonb_populate_recordset(NULL::${name},${literal(json)}::jsonb)`;
    if(table.action==='n'){
     // These rows survive deletion with a NULL link; restore the link without overwriting CRM changes.
     statements.push(`INSERT INTO ${name} SELECT * FROM ${records} ON CONFLICT DO NOTHING;`);
     statements.push(`UPDATE ${name} t SET ${quote(table.column)}=saved.${quote(table.column)} FROM ${records} saved WHERE t.id=saved.id AND t.${quote(table.column)} IS NULL;`);
    }else statements.push(`INSERT INTO ${name} SELECT * FROM ${records};`);
   }
   const body=statements.join('\n');const restoreSQL=`-- Restore archived vehicles and their related records. Run only against the same local database.\nBEGIN;\nSET LOCAL standard_conforming_strings=on;\n${body}\nCOMMIT;\n`;
   fs.writeFileSync(path.join(directory,'restore.sql'),restoreSQL);
   const manifest={database:'127.0.0.1:55432/changecars',createdAt:new Date().toISOString(),archivedVehicles:counts.vehicles,tables:counts,restoreSha256:checksum(restoreSQL),fullBackup:'full-before-delete.dump'};
   fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
   // Rehearse DELETE + exact subset restore inside a savepoint, and compare every captured row.
   await db.query('SAVEPOINT restore_rehearsal');await db.query(`DELETE FROM vehicles WHERE id IN (SELECT id FROM archived_targets)`);await db.query(body);
   for(const table of tables){
    if(!counts[table.name])continue;
    const name=`${quote(table.schema)}.${quote(table.name)}`;
    const restored=(await db.query(`SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb)::text data FROM ${name} t WHERE t.${quote(table.column)} IN (SELECT id FROM archived_targets)`)).rows[0].data;
    const canonical=text=>JSON.stringify(JSON.parse(text).map(row=>JSON.stringify(row)).sort());
    if(canonical(restored)!==canonical(data[table.name]))throw Error(`Restore rehearsal mismatch for ${table.name}`);
   }
   await db.query('ROLLBACK TO SAVEPOINT restore_rehearsal');
   const deleted=await db.query(`DELETE FROM vehicles WHERE id IN (SELECT id FROM archived_targets) AND status='ARCHIVED'`);
   if(deleted.rowCount!==counts.vehicles)throw Error('Deletion count mismatch');
   const changed=Number((await db.query(`SELECT count(*) count FROM preserved_active p LEFT JOIN vehicles v ON v.id=p.id WHERE v.id IS NULL OR md5(to_jsonb(v)::text)<>p.fingerprint`)).rows[0].count);
   if(changed)throw Error('An active vehicle changed; rolling back');
   const remaining=Number((await db.query(`SELECT count(*) count FROM vehicles WHERE status='ARCHIVED'`)).rows[0].count);
   if(remaining)throw Error('Archived vehicles remain; rolling back');
   await db.query('COMMIT');
   const report={deletedVehicles:deleted.rowCount,archivedRemaining:remaining,activeVehiclesChanged:changed,restoreRehearsal:'PASS: all archived vehicles and dependent rows restored exactly inside a rolled-back test',backup:directory,tables:counts};
   fs.writeFileSync(path.join(directory,'deletion-report.json'),JSON.stringify(report,null,2)+'\n');
   fs.writeFileSync(path.join(directory,'README.md'),`# Archived vehicle backup\n\nDeleted ${deleted.rowCount} archived vehicles from local DB only.\n\nRestore those vehicles without replacing the active database (from repository root):\n\n\`\`\`sh\nnode backend/scripts/backup-delete-archived.cjs --restore '${directory}'\n\`\`\`\n\nOriginal IDs, names and related records are included in restore.sql. Restore was rehearsed and verified before deletion. Existing conflicting vehicle IDs abort restoration rather than overwrite data. Keep the referenced dealers, catalogue records and local media available. Image files were not deleted. full-before-delete.dump is an additional full database backup; restoring that full dump is a separate operation that may replace newer data.\n`);
   console.log(JSON.stringify(report));
  }catch(error){await db.query('ROLLBACK');throw error;}
 }finally{await db.end();}
})().catch(error=>{console.error(error.message);process.exitCode=1});
