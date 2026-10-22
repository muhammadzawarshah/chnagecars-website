/** Read-only inventory reconciliation against both imported and freshly fetched sources. */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { existsSync, readFileSync, writeFileSync, openSync, writeSync, closeSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { provinceFromName, slugify } from '../src/modules/web/web-format';

type Row=Record<string,any>;
const importedDir=resolve(__dirname,'../.local/dealertrade');
const auditDir=resolve(process.env.DEALERTRADE_AUDIT_DIR || resolve(__dirname,'../.local/dealertrade-audit'));
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!,max:4,options:'-c default_transaction_read_only=on'})});
const read=(file:string)=>JSON.parse(readFileSync(file,'utf8'));
const positive=(v:any)=>v!==null&&v!==undefined&&v!==''&&Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):null;
const uuid=(key:string)=>{const h=createHash('sha256').update('changecars-fbook:'+key).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
const digest=(file:string)=>createHash('sha256').update(readFileSync(file)).digest('hex');
const bodyMap:Record<string,string>={'suv':'suvs','sedan':'sedans','hatchback':'hatchbacks','coupe':'coupes','convertible':'convertibles','mpv':'mpvs','panel-van':'panel-vans','double-cab-bakkie':'double-cabs','single-cab-bakkie':'single-cabs','extended-cab':'king-cabs','minibus':'minibuses','motorbike':'motorbikes','station-wagon':'station-wagons'};

async function main(){
  const startedAt=new Date().toISOString();
  const imported:Row[]=read(resolve(importedDir,'stock-all.json'));
  const importedDealers:Row[]=read(resolve(importedDir,'dealers-all.json'));
  const observationPath=resolve(auditDir,'stock-observation-report.json');
  const observation=existsSync(observationPath)?read(observationPath):null;
  const referenceFile=resolve(auditDir,observation?'stock-observed.json':'stock-all.json');
  const fresh:Row[]=read(referenceFile);
  const dealerReferenceFile=resolve(auditDir,existsSync(resolve(auditDir,'dealers-observed.json'))?'dealers-observed.json':'dealers-all.json');
  const freshDealers:Row[]=read(dealerReferenceFile);
  const historical:Row[]=read(resolve(__dirname,'fixtures/fbook/listings.json'));
  const colours:Record<string,string>=read(resolve(__dirname,'../.local/live-colour-mapping.json'));
  const legacyMedia=new Map<string,Row>((read(resolve(__dirname,'fixtures/fbook/images.json')) as Row[]).map(r=>[String(r.vehicleId)+':'+r.position,r]));
  const oldById=new Map(imported.map(r=>[String(r.vehicle_id),r]));
  const freshById=new Map(fresh.map(r=>[String(r.vehicle_id),r]));
  const historicalById=new Map(historical.map(r=>[String(r.vehicle_id),r]));
  const excluded=new Set(read(resolve(importedDir,'import-report.json')).issues.filter((r:Row)=>r.vehicleId).map((r:Row)=>r.vehicleId));
  const details=openSync(resolve(auditDir,'differences.ndjson'),'w');
  const csv=openSync(resolve(auditDir,'differences.csv'),'w');
  writeSync(csv,'category,kind,external_id,field,expected,actual\n');
  const counts:Record<string,number>={},fields:Record<string,number>={},checks:Record<string,number>={};
  const emit=(category:string,kind:string,externalId:string,field:string,expected:any,actual:any)=>{
    counts[category]=(counts[category]??0)+1;fields[category+':'+field]=(fields[category+':'+field]??0)+1;
    const row={category,kind,externalId,field,expected,actual};writeSync(details,JSON.stringify(row)+'\n');
    writeSync(csv,[category,kind,externalId,field,JSON.stringify(expected),JSON.stringify(actual)].map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')+'\n');
  };
  const compare=(kind:string,id:string,field:string,expected:any,actual:any)=>{
    checks[kind+':'+field]=(checks[kind+':'+field]??0)+1;
    if(!isDeepStrictEqual(expected,actual))emit('database_mismatch',kind,id,field,expected,actual);
  };
  console.log('Reading inventory, galleries, dealers and raw records in one read-only repeatable-read transaction');
  const state=await db.$transaction(async tx=>{
    const vehicles=await tx.vehicle.findMany({include:{make:true,model:true,variant:{include:{specification:true}},categories:true,images:{select:{id:true,storageKey:true,url:true,sizeBytes:true,position:true,isPrimary:true}}}});
    const dealers=await tx.dealer.findMany({include:{branches:true}});
    const raw=await tx.$queryRaw<{kind:string;externalId:string;payload:Row}[]>`SELECT kind,"externalId",payload FROM source_feed_records WHERE source='dealertrade'`;
    return {vehicles,dealers,raw};
  },{isolationLevel:'RepeatableRead',timeout:180000});
  const byId=new Map<string,typeof state.vehicles[number]>(),dealerById=new Map(state.dealers.map(r=>[r.id,r]));
  const noSource:Row[]=[],legacyOnly:Row[]=[],notInFresh:Row[]=[];
  for(const v of state.vehicles){
    const id=String((v.sourceData as Row|null)?.vehicle_id??'');
    if(!id){noSource.push({id:v.id,title:v.title,status:v.status});continue;}
    if(byId.has(id))emit('database_mismatch','vehicle',id,'duplicate_external_identity','one row',[byId.get(id)!.id,v.id]);
    byId.set(id,v);
    if(!oldById.has(id))legacyOnly.push({externalId:id,id:v.id,status:v.status,title:v.title});
    if(!freshById.has(id))notInFresh.push({externalId:id,id:v.id,status:v.status,title:v.title});
  }
  const rawById=new Map(state.raw.map(r=>[r.kind+':'+r.externalId,r.payload]));
  let rawEqual=0;
  for(const [kind,rows,key] of [['dealer',importedDealers,'dealer_id'],['vehicle',imported,'vehicle_id']] as const){
    for(const r of rows){const id=String(r[key]),saved=rawById.get(kind+':'+id);if(isDeepStrictEqual(r,saved))rawEqual++;else emit('raw_storage_mismatch',kind,id,'payload',r,saved??null);}
  }
  let common=0,upstreamChanged=0,upstreamUnchanged=0;
  const added:Row[]=[],removed:Row[]=[];
  for(const r of fresh){
    const id=String(r.vehicle_id),previous=oldById.get(id);
    if(!previous){added.push({externalId:id,dealerId:r.dealer_id});emit('upstream_added','vehicle',id,'record',null,r);continue;}
    common++;
    if(isDeepStrictEqual(previous,r)){upstreamUnchanged++;continue;}
    upstreamChanged++;
    for(const field of new Set([...Object.keys(previous),...Object.keys(r)]))if(!isDeepStrictEqual(previous[field],r[field]))emit('upstream_changed','vehicle',id,field,previous[field],r[field]);
  }
  for(const r of imported)if(!freshById.has(String(r.vehicle_id))){removed.push({externalId:String(r.vehicle_id),dealerId:r.dealer_id});emit(observation?'not_observed_in_changing_traversal':'upstream_removed','vehicle',String(r.vehicle_id),'record',r,null);}
  const previousDealers=new Map(importedDealers.map(r=>[String(r.dealer_id),r]));
  let dealerSourceChanges=0;
  for(const r of freshDealers){const id=String(r.dealer_id),old=previousDealers.get(id);if(!old){emit('upstream_added','dealer',id,'record',null,r);dealerSourceChanges++;}else for(const field of new Set([...Object.keys(old),...Object.keys(r)]))if(!isDeepStrictEqual(old[field],r[field])){emit('upstream_changed','dealer',id,field,old[field],r[field]);dealerSourceChanges++;}}
  const freshDealerIds=new Set(freshDealers.map(r=>String(r.dealer_id)));
  for(const r of importedDealers)if(!freshDealerIds.has(String(r.dealer_id))){emit('upstream_removed','dealer',String(r.dealer_id),'record',r,null);dealerSourceChanges++;}
  const unknowns={year:0,colour:0,fuelType:0,variant:0,zeroPhotos:0};
  const coverage={matchedInventory:0,rawOnly:0,localPhotos:0,remotePhotos:0,photoReferences:0,verifiedLegacyYears:0,verifiedLegacyColours:0};
  const sourceWarnings:Row[]=[],qualityRows:Row[]=[];
  const uniquePhotoUrls=new Set<string>();
  for(const r of imported){
    const id=String(r.vehicle_id),v=byId.get(id);
    if(!v){coverage.rawOnly++;emit(excluded.has(id)?'documented_raw_only':'database_mismatch','vehicle',id,'inventory_record',r.dealer_id,null);continue;}
    coverage.matchedInventory++;
    compare('vehicle',id,'sourceData.dealertrade',r,(v.sourceData as Row).dealertrade??null);
    compare('vehicle',id,'stockNumber',id,v.stockNumber);
    compare('vehicle',id,'dealerId',uuid('dealer:'+r.dealer_id),v.dealerId);
    compare('vehicle',id,'make',slugify(r.make_name??''),v.make.slug);
    compare('vehicle',id,'model',slugify(r.model_name??''),v.model.slug);
    compare('vehicle',id,'model.makeId',v.makeId,v.model.makeId);
    compare('vehicle',id,'price',Number(r.price),v.price);
    const discount=positive(r.discount_price),special=discount&&discount<Number(r.price)?discount:null;
    compare('vehicle',id,'specialPrice',special,v.specialPrice);compare('vehicle',id,'isSpecial',special!==null,v.isSpecial);
    compare('vehicle',id,'condition',({New:'NEW',Used:'USED',Demo:'DEMO'} as Row)[r.type],v.condition);
    const transmission=({1:'MANUAL',2:'AUTOMATIC'} as Row)[r.transmission_type_id];if(transmission)compare('vehicle',id,'transmission',transmission,v.transmission);
    if(r.mileage!==null&&r.mileage!==''&&Number.isSafeInteger(Number(r.mileage))&&Number(r.mileage)>=0)compare('vehicle',id,'mileage',Number(r.mileage),v.mileage);
    for(const [from,to] of Object.entries({engine_capacity:'engineCapacityCc',kilowatts:'powerKw',cylinders:'cylinders',no_seats:'seats',no_doors:'doors'}))if(positive(r[from]))compare('vehicle',id,to,Number(r[from]),(v as Row)[to]);
    const drive=({'4X2':'4x2','4X4':'4x4',AWD:'AWD',FWD:'FWD',RWD:'RWD'} as Row)[r.driven_wheels];if(drive)compare('vehicle',id,'drivetrain',drive,v.drivetrain);
    const urlParts=String(r.single_vehicle_url??'').replace(/^https?:\/\/[^/]+\//,'').split('/');
    const province=provinceFromName(urlParts[1]??'');if(province)compare('vehicle',id,'province',province,v.province);
    if(urlParts[2])compare('vehicle',id,'city',slugify(decodeURIComponent(urlParts[2])),slugify(v.city));
    const body=bodyMap[urlParts[3]];if(body)compare('vehicle',id,'body_category_present',true,v.categories.some(c=>c.slug===body));
    const source=historicalById.get(id);
    if(source){
      const year=positive(source.year)&&Number(source.year)>=1900&&Number(source.year)<=2100?Number(source.year):null;
      compare('vehicle',id,'year_from_original_xml',year,v.year);if(year)coverage.verifiedLegacyYears++;
      const rawColour=source.exterior_color;
      if(rawColour&&colours[rawColour]){compare('vehicle',id,'colour_from_original_mapping',colours[rawColour],v.colour);coverage.verifiedLegacyColours++;}
    }
    if(v.variant){
      compare('vehicle',id,'variant.modelId',v.modelId,v.variant.modelId);
      const extra=v.variant.specification?.extra as Row|null;
      if(extra?.source==='dealertrade'){
        compare('vehicle',id,'variant.externalId',r.model_variant_id,extra.model_variant_id);
        compare('vehicle',id,'variant.name',r.variant_name,v.variant.name);
        compare('vehicle',id,'variant.yearFrom',Number(String(r.introduction_date).slice(0,4)),v.variant.yearFrom);
        const spec=v.variant.specification!;
        for(const [from,to] of Object.entries({engine_capacity:'engineCapacityCc',kilowatts:'powerKw',cylinders:'cylinders',no_seats:'seats',no_doors:'doors',no_gears:'gears',fuel_tank_size:'fuelTankLitres'})){
          if((spec as Row)[to]!==null)compare('vehicle',id,'variant.specification.'+to,Number(r[from]),(spec as Row)[to]);
        }
        if(spec.transmission&&transmission)compare('vehicle',id,'variant.specification.transmission',transmission,spec.transmission);
        if(spec.drivetrain&&drive)compare('vehicle',id,'variant.specification.drivetrain',drive,spec.drivetrain);
      }
    }
    const apiPhotos:string[]=r.photos??[],images=v.images.filter(i=>i.storageKey.startsWith('dealertrade/')).sort((a,b)=>a.position-b.position);
    compare('vehicle',id,'imageCount',apiPhotos.length,v.imageCount);compare('vehicle',id,'galleryRows',apiPhotos.length,images.length);
    if(Number(r.image_count)!==apiPhotos.length)sourceWarnings.push({externalId:id,field:'image_count',reported:r.image_count,actualPhotos:apiPhotos.length});
    if(new Set(apiPhotos).size!==apiPhotos.length)sourceWarnings.push({externalId:id,field:'photos',reason:'Duplicate photo URL in upstream gallery'});
    for(let position=0;position<apiPhotos.length;position++){
      const p=apiPhotos[position],url=p.startsWith('https://')?p:r.cdn_url.replace(/\/$/,'')+'/'+p.replace(/^\//,''),i=images[position];
      uniquePhotoUrls.add(url);coverage.photoReferences++;
      if(!i){emit('database_mismatch','image',id,String(position),'gallery row',null);continue;}
      compare('image',id,`position:${position}`,position,i.position);compare('image',id,`primary:${position}`,position===0,i.isPrimary);
      if(i.url?.startsWith('/media/dealertrade/')){
        const extension=new URL(url).pathname.match(/\.(jpg|jpeg|png|webp)$/i)?.[0].toLowerCase()??'.jpg';
        const expected='/media/dealertrade/'+createHash('sha256').update(url).digest('hex')+extension;
        compare('image',id,`url:${position}`,expected,i.url);
        const path=resolve(__dirname,'../../frontend/public',i.url.slice(1));
        if(!existsSync(path)||statSync(path).size!==i.sizeBytes)emit('local_file_mismatch','image',id,String(position),i.sizeBytes,existsSync(path)?statSync(path).size:null);
        coverage.localPhotos++;
      }else{compare('image',id,`url:${position}`,url,i.url);coverage.remotePhotos++;}
    }
    if(apiPhotos.length)compare('vehicle',id,'primaryImageUrl',images[0]?.url??null,v.primaryImageUrl);
    if(!v.year)unknowns.year++;if(!v.colour)unknowns.colour++;if(v.fuelType==='OTHER')unknowns.fuelType++;if(!v.variantId)unknowns.variant++;if(!apiPhotos.length)unknowns.zeroPhotos++;
    if(!v.year||!v.colour||v.fuelType==='OTHER')qualityRows.push({externalId:id,year:v.year,colour:v.colour,fuelType:v.fuelType,sourceFuelId:r.fuel_type_id,sourceWebsite:r.single_vehicle_url?'https://www.changecars.co.za/'+r.single_vehicle_url:null});
    if(coverage.matchedInventory%5000===0)console.log(`Audited ${coverage.matchedInventory}/${imported.length} inventory rows`);
  }
  for(const r of importedDealers){
    const id=String(r.dealer_id),d=dealerById.get(uuid('dealer:'+id));if(!d){emit('database_mismatch','dealer',id,'record',r,null);continue;}
    for(const [from,to] of Object.entries({dealer_name:'name',address:'address',telephone:'phone',email:'email',description:'description'}))if(r[from])compare('dealer',id,to,r[from],(d as Row)[to]);
    compare('dealer',id,'province',provinceFromName(r.province),d.province);
    const branch=d.branches.find(b=>b.id===uuid('branch:'+id));
    if(!branch)emit('database_mismatch','dealer',id,'branch','feed head office',null);
    else{
      compare('dealer',id,'branch.dealerId',d.id,branch.dealerId);
      for(const [from,to] of Object.entries({dealer_name:'name',address:'address',telephone:'phone',email:'email'}))if(r[from])compare('dealer',id,'branch.'+to,r[from],(branch as Row)[to]);
      compare('dealer',id,'branch.province',provinceFromName(r.province),branch.province);
    }
  }
  let legacyChecked=0,legacyPhotosChecked=0,legacyPlaceholders=0;
  for(const row of legacyOnly){
    const v=byId.get(row.externalId)!,r=historicalById.get(row.externalId);if(!r){emit('unclassified_inventory','vehicle',row.externalId,'provenance',null,row);continue;}
    legacyChecked++;compare('legacy_vehicle',row.externalId,'sourceData',r,v.sourceData);compare('legacy_vehicle',row.externalId,'price',Number(r.price.replace(/\s+ZAR$/,'')),v.price);
    const id=row.externalId,price=Number(r.price.replace(/\s+ZAR$/,'')),sale=Number(r.sale_price.replace(/\s+ZAR$/,''));
    compare('legacy_vehicle',id,'stockNumber',id,v.stockNumber);compare('legacy_vehicle',id,'dealerId',uuid('dealer:'+r.dealer_id),v.dealerId);
    compare('legacy_vehicle',id,'make',slugify(r.make),v.make.slug);compare('legacy_vehicle',id,'model',slugify(r.model),v.model.slug);compare('legacy_vehicle',id,'model.makeId',v.makeId,v.model.makeId);
    compare('legacy_vehicle',id,'title',r.title,v.title);compare('legacy_vehicle',id,'description',r.description,v.description);
    compare('legacy_vehicle',id,'specialPrice',sale>0&&sale<price?sale:null,v.specialPrice);compare('legacy_vehicle',id,'isSpecial',sale>0&&sale<price,v.isSpecial);
    compare('legacy_vehicle',id,'condition',({New:'NEW',Used:'USED',Demo:'DEMO'} as Row)[r.state_of_vehicle],v.condition);
    const year=positive(r.year)&&Number(r.year)>=1900&&Number(r.year)<=2100?Number(r.year):null;
    compare('legacy_vehicle',id,'year',year,v.year);compare('legacy_vehicle',id,'mileage',Number(r.mileage.value)>=0?Number(r.mileage.value):null,v.mileage);
    if(r.exterior_color&&colours[r.exterior_color])compare('legacy_vehicle',id,'colour',colours[r.exterior_color],v.colour);
    compare('legacy_vehicle',id,'province',provinceFromName(r.address.region),v.province);compare('legacy_vehicle',id,'city',r.address.city,v.city);
    const images=v.images.filter(i=>i.storageKey.startsWith('fbook/'+id+'-')).sort((a,b)=>a.position-b.position);
    compare('legacy_vehicle',id,'imageCount',r.images.length,v.imageCount);compare('legacy_vehicle',id,'galleryRows',r.images.length,images.length);
    for(let position=0;position<r.images.length;position++){
      const image=images[position],saved=legacyMedia.get(id+':'+position);legacyPhotosChecked++;
      if(!image){emit('database_mismatch','legacy_image',id,String(position),'gallery row',null);continue;}
      compare('legacy_image',id,'position:'+position,position,image.position);compare('legacy_image',id,'primary:'+position,position===0,image.isPrimary);
      if(saved?.url)compare('legacy_image',id,'url:'+position,saved.url,image.url);
      else if(image.url?.startsWith('https://'))compare('legacy_image',id,'url:'+position,r.images[position],image.url);
      if(image.url?.startsWith('/')){const file=resolve(__dirname,'../../frontend/public',image.url.slice(1));if(!existsSync(file)||statSync(file).size!==image.sizeBytes)emit('local_file_mismatch','legacy_image',id,String(position),image.sizeBytes,existsSync(file)?statSync(file).size:null);}
      if(image.url==='/img/feed-image-unavailable.png')legacyPlaceholders++;
    }
    if(r.images.length)compare('legacy_vehicle',id,'primaryImageUrl',images[0]?.url??null,v.primaryImageUrl);
  }
  closeSync(details);closeSync(csv);
  const report={startedAt,completedAt:new Date().toISOString(),mode:'read-only; repeatable-read database snapshot',
    sourceFiles:{importedSnapshotSha256:digest(resolve(importedDir,'stock-all.json')),freshReferenceSha256:digest(referenceFile),freshReferenceFile:referenceFile},
    freshReferenceIntegrity:observation??{mode:'complete verified paginated snapshot',atomicSnapshot:'No server transaction documented; page totals and uniqueness validated'},
    totals:{databaseVehicles:state.vehicles.length,databaseDealers:state.dealers.length,importedApiVehicles:imported.length,freshApiVehicles:fresh.length,importedApiDealers:importedDealers.length,freshApiDealers:freshDealers.length,rawRecordsCompared:imported.length+importedDealers.length,rawRecordsEqual:rawEqual,legacyOnlyInventory:legacyOnly.length,legacyRecordsChecked:legacyChecked,recordsWithoutFeedSource:noSource.length},
    apiChanges:{common,unchanged:upstreamUnchanged,changed:upstreamChanged,added:added.length,notObserved:removed.length,notObservedMeansRemoved:!observation,dealerFieldChanges:dealerSourceChanges},
    coverage:{...coverage,uniquePhotoUrls:uniquePhotoUrls.size,legacyPhotosChecked,legacyPlaceholders,totalFieldChecks:Object.values(checks).reduce((a,b)=>a+b,0)},unknowns,
    unknownsAllInventory:{year:state.vehicles.filter(v=>v.year===null).length,colour:state.vehicles.filter(v=>!v.colour).length,fuelType:state.vehicles.filter(v=>v.fuelType==='OTHER').length},
    dealerCompleteness:{missingSourceEmail:importedDealers.filter(r=>!r.email).length,missingSourcePhone:importedDealers.filter(r=>!r.telephone).length,missingSourceAddress:importedDealers.filter(r=>!r.address).length,emptyDatabaseCity:state.dealers.filter(r=>!r.city).length},
    differences:counts,differencesByField:fields,sourceWarningCount:sourceWarnings.length,
    websiteVerification:existsSync(resolve(auditDir,'website/evidence.json'))?read(resolve(auditDir,'website/evidence.json')):{rowLevelStatus:'not_checked',fullyVerifiedAgainstOriginalWebsite:false},
    conclusion:(counts.database_mismatch||counts.raw_storage_mismatch||counts.local_file_mismatch)?'Database discrepancies require review':'Imported inventory matches checked stored source fields. Live API observations are classified separately; independent original website row-level verification remains blocked'};
  writeFileSync(resolve(auditDir,'audit-report.json'),JSON.stringify(report,null,2));
  writeFileSync(resolve(auditDir,'legacy-not-in-fresh-api.json'),JSON.stringify(notInFresh,null,2));
  writeFileSync(resolve(auditDir,'records-without-source.json'),JSON.stringify(noSource,null,2));
  writeFileSync(resolve(auditDir,'source-warnings.json'),JSON.stringify(sourceWarnings,null,2));
  writeFileSync(resolve(auditDir,'missing-source-fields.json'),JSON.stringify(qualityRows,null,2));
  console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>db.$disconnect());
