/** Refresh only model years from DealerTrade; preserve IDs, URLs and other inventory fields. */
const fs=require('node:fs'),path=require('node:path'),{execFile}=require('node:child_process');
require('dotenv').config({path:path.resolve(__dirname,'../.env'),quiet:true});
const {Client}=require('pg');const u=new URL(process.env.DATABASE_URL);
if(u.hostname!=='127.0.0.1'||u.port!=='55432'||u.pathname!=='/changecars')throw Error('Local database only');
const token=process.env.DEALERTRADE_TOKEN||fs.readFileSync(path.resolve(__dirname,'../.local/dealertrade/token'),'utf8').trim();
const directory=path.resolve(__dirname,'../.local/year-sync');fs.mkdirSync(directory,{recursive:true});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function fetchPage(page){for(let attempt=0;attempt<6;attempt++){
 const r=await new Promise(resolve=>execFile('curl',['--config','-','--fail','--silent','--show-error','--max-time','90','-H','Content-Type: application/json','--data','{}',`https://dealertrade.co.za/api/apk/stock/by-dealers?page=${page}&per_page=1000`],{encoding:'utf8',maxBuffer:20*1024*1024},(error,stdout,stderr)=>resolve({status:error?1:0,stdout,stderr})).stdin.end('header = '+JSON.stringify('Authorization: Bearer '+token)+'\n'));
 if(r.status===0){const d=JSON.parse(r.stdout);if(d.current_page===page&&Array.isArray(d.data)){fs.writeFileSync(path.join(directory,`${page}.json`),JSON.stringify(d));return d;}}
 await delay(r.stderr.includes('429')?60000:2000*(attempt+1));
}throw Error('Page failed '+page);}
(async()=>{const first=await fetchPage(1);let rows=[...first.data],next=2,done=1;await Promise.all(Array.from({length:4},async()=>{while(next<=first.last_page){const page=next++;const file=path.join(directory,`${page}.json`);const d=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):await fetchPage(page);rows.push(...d.data);done++;if(done%20===0)console.log(`Fetched ${done}/${first.last_page}`);}}));
const unique=new Map(rows.map(r=>[String(r.vehicle_id),r]));const values=[...unique].filter(([,r])=>Number.isInteger(Number(r.model_year))&&Number(r.model_year)>=1900&&Number(r.model_year)<=2100).map(([id,r])=>({id,year:Number(r.model_year)}));
const db=new Client({connectionString:u.href});await db.connect();try{
 const before=(await db.query('SELECT id,year,title,"sourceData" FROM vehicles WHERE id=ANY($1::text[])',[values.map(r=>r.id)])).rows;
 fs.writeFileSync(path.join(directory,`before-${Date.now()}.json`),JSON.stringify(before));
 await db.query('BEGIN');
 const result=await db.query(`UPDATE vehicles v SET year=r.year,title=concat(r.year,' ',regexp_replace(v.title,'^[0-9]{4} ','')),"sourceData"=jsonb_set(COALESCE(v."sourceData",'{}'::jsonb),'{dealertrade,model_year}',to_jsonb(r.year),true) FROM jsonb_to_recordset($1::jsonb) AS r(id text,year int) WHERE v.id=r.id`,[JSON.stringify(values)]);
 await db.query(`UPDATE source_feed_records s SET payload=jsonb_set(s.payload,'{model_year}',to_jsonb(r.year),true) FROM jsonb_to_recordset($1::jsonb) AS r(id text,year int) WHERE s.source='dealertrade' AND s.kind='vehicle' AND s."externalId"=r.id`,[JSON.stringify(values)]);
 await db.query('COMMIT');console.log(JSON.stringify({fetched:rows.length,unique:unique.size,validYears:values.length,updated:result.rowCount,missingYears:(await db.query('SELECT count(*)::int n FROM vehicles WHERE year IS NULL')).rows[0].n}));
}catch(e){await db.query('ROLLBACK');throw e;}finally{await db.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1});
