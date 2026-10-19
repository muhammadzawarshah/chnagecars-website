/** Compare a completed fresh API capture against local stored data. No permanent DB writes. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
require('dotenv').config({path:path.resolve(__dirname,'../.env'),quiet:true});const {Client}=require('pg');
const directory=path.resolve(process.argv[2]||'backend/.local/dealertrade-live-20261019-fresh');
const url=new URL(process.env.DATABASE_URL);if(url.hostname!=='127.0.0.1'||url.port!=='55432')throw Error('Local DB only');
const canonical=value=>JSON.stringify(value&&typeof value==='object'?Array.isArray(value)?value.map(v=>JSON.parse(canonical(v))):Object.fromEntries(Object.keys(value).sort().map(key=>[key,JSON.parse(canonical(value[key]))])):value);
(async()=>{
 const capture=JSON.parse(fs.readFileSync(path.join(directory,'fetch-report.json'),'utf8'));
 const vehicles=JSON.parse(fs.readFileSync(path.join(directory,'vehicles.json'),'utf8'));
 const dealers=JSON.parse(fs.readFileSync(path.join(directory,'dealers.json'),'utf8'));
 assert.equal(new Set(vehicles.map(row=>String(row.vehicle_id))).size,vehicles.length);
 const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();
 try{
  const source=(await db.query(`SELECT kind,"externalId",payload FROM source_feed_records WHERE source='dealertrade'`)).rows;
  const local=(await db.query(`SELECT id,"dealerId",title,colour,"sourceData"->'dealertrade' payload FROM vehicles`)).rows;
  const dealerIds=new Set((await db.query('SELECT id FROM dealers')).rows.map(row=>row.id));
  const vehicleMap=new Map(local.map(row=>[row.id,row]));
  const sourceVehicles=new Map(source.filter(row=>row.kind==='vehicle').map(row=>[row.externalId,row.payload]));
  const sourceDealers=new Map(source.filter(row=>row.kind==='dealer').map(row=>[row.externalId,row.payload]));
  function compare(rows,key,stored){
   const fields={},newKeys={},missing=[],unchanged=[],changed=[];
   for(const row of rows){const id=String(row[key]);const previous=stored.get(id);if(!previous){missing.push(id);continue;}let different=false;
    for(const [key,value]of Object.entries(row)){
     if(!Object.prototype.hasOwnProperty.call(previous,key)){newKeys[key]=(newKeys[key]||0)+1;different=true;}
     else if(canonical(value)!==canonical(previous[key])){fields[key]=(fields[key]||0)+1;different=true;}
    }
    if(Object.keys(previous).some(key=>!Object.prototype.hasOwnProperty.call(row,key)))different=true;
    (different?changed:unchanged).push(id);
   }
   return {rawRecordsNotPreviouslyStored:missing.length,missingIdSample:missing.slice(0,25),unchangedRecords:unchanged.length,changedRecords:changed.length,changedFields:fields,newFieldsNotInOldPayload:newKeys};
  }
  const absent=vehicles.filter(row=>!vehicleMap.has(String(row.vehicle_id)));
  const archiveRoot=path.resolve(__dirname,'../.local/archived-backups');
  let deletedArchived=new Set();
  if(fs.existsSync(archiveRoot)) {
    const last=fs.readdirSync(archiveRoot).sort().at(-1);
    if(last) {
      const sql=fs.readFileSync(path.join(archiveRoot,last,'restore.sql'),'utf8');
      const prefix='INSERT INTO "public"."vehicles" SELECT * FROM jsonb_populate_recordset(NULL::"public"."vehicles",'+String.fromCharCode(39);
      const start=sql.indexOf(prefix)+prefix.length,end=sql.indexOf(String.fromCharCode(39)+'::jsonb);',start);
      if(start>=prefix.length&&end>start)deletedArchived=new Set(JSON.parse(sql.slice(start,end).replaceAll("''", "'")).flatMap(row=>row.sourceData?.dealertrade?.vehicle_id==null?[]:[String(row.sourceData.dealertrade.vehicle_id)]));
    }
  }

  const liveIds=new Set(vehicles.map(row=>String(row.vehicle_id)));
  const report={fetchedAt:new Date(capture.completedAtEpoch*1000).toISOString(),capture,localInventoryRows:local.length,liveVehicleRows:vehicles.length,liveDealerRows:dealers.length,liveVehiclesInInventory:vehicles.length-absent.length,liveVehiclesNotInInventory:absent.length,intentionallyDeletedArchivedStillInFeed:absent.filter(row=>deletedArchived.has(String(row.vehicle_id))).length,otherMissingInventoryRecords:absent.filter(row=>!deletedArchived.has(String(row.vehicle_id))).map(row=>({vehicleId:String(row.vehicle_id),dealerId:String(row.dealer_id),alreadyInStoredSource:sourceVehicles.has(String(row.vehicle_id)),enabled:row.enabled,removed:row.removed})),notInInventoryIdSample:absent.slice(0,25).map(row=>String(row.vehicle_id)),liveDealersMissingInDealerTable:dealers.filter(row=>!dealerIds.has(String(row.dealer_id))).map(row=>String(row.dealer_id)),localVehiclesNotObservedInFreshCapture:local.filter(row=>!liveIds.has(row.id)).length,vehicleRawComparison:compare(vehicles,'vehicle_id',sourceVehicles),dealerRawComparison:compare(dealers,'dealer_id',sourceDealers),liveColourFields:Object.fromEntries(['colour','color','exterior_color','exterior_colour'].map(key=>[key,vehicles.filter(row=>Object.prototype.hasOwnProperty.call(row,key)).length])),databaseModified:false,note:'Live API traversal is not atomic. No absence-based deletions or imports were performed. Missing/changed refer to this fresh capture versus older stored data.'};
  fs.writeFileSync(path.join(directory,'database-audit.json'),JSON.stringify(report,null,2)+'\n');
  const {otherMissingInventoryRecords,...summary}=report;
  console.log(JSON.stringify({...summary,otherMissingInventoryRecordCount:otherMissingInventoryRecords.length},null,2));
 }finally{await db.end();}
})().catch(error=>{console.error(error.message);process.exitCode=1});
