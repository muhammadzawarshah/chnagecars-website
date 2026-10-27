import { titleCase } from '../src/common/utils/display-text';
import { standardColourName } from '../src/modules/vehicles/standard-colours';
import { BODY_TYPE_CATEGORY_SLUGS, resolveBodyType } from '../src/modules/vehicles/body-type-mapping';
/** API-authoritative row updates with explicit blank preservation and optimistic writes. */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../src/generated/prisma/client';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { existsSync,readFileSync,writeFileSync,mkdirSync,statSync,openSync,writeSync,closeSync,createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';
import { empty,mergeProvided,changedFields,integer,sourceVehicleAttributes,stockMetadata,FeedRow as Row } from './dealertrade-reconcile-policy';
import { provinceFromName,slugify } from '../src/modules/web/web-format';

const root=resolve(__dirname,'../..'),dir=resolve(process.env.DEALERTRADE_RECONCILE_DIR || resolve(__dirname,'../.local/dealertrade-reconcile'));mkdirSync(dir,{recursive:true});
const source=resolve(dir,'source'),planFile=resolve(dir,'plan.json');
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!,max:10,options:'-c TimeZone=UTC'})});
const mode=process.argv[2]??'--plan';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const json=(value:any)=>JSON.parse(JSON.stringify(value));
const uuid=(key:string,namespace='dealertrade')=>{const h=createHash('sha256').update(`changecars-${namespace}:${key}`).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
const write=(name:string,data:any)=>writeFileSync(resolve(dir,name),JSON.stringify(data,null,2));
function displayFields(data:Row){for(const key of ['name','title','description','address','city'])if(typeof data[key]==='string')data[key]=titleCase(data[key]);return data;}
const protectedImage=(i:Row)=>createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(json(i)).filter(([k])=>!['url','sizeBytes','contentType','position','isPrimary','updatedAt'].includes(k)).sort(([a],[b])=>a.localeCompare(b))))).digest('hex');
async function loadPlan(){const p=read(planFile);p.vehiclePlans=[];for await(const line of createInterface({input:createReadStream(resolve(dir,p.vehiclePlansFile)),crlfDelay:Infinity}))if(line)p.vehiclePlans.push(JSON.parse(line));return p;}
const bodyMap:Row={suv:'suvs',sedan:'sedans',hatchback:'hatchbacks',coupe:'coupes',convertible:'convertibles',mpv:'mpvs','panel-van':'panel-vans','double-cab-bakkie':'double-cabs','single-cab-bakkie':'single-cabs','extended-cab':'king-cabs',minibus:'minibuses',motorbike:'motorbikes','station-wagon':'station-wagons'};
const sourceUrl=(r:Row,p:string)=>p.startsWith('https://')?p:r.cdn_url.replace(/\/$/,'')+'/'+p.replace(/^\//,'');
function cachedImage(url:string){
  const u=new URL(url);if(u.protocol!=='https:'||u.hostname!=='www.changecars.co.za')throw Error('Untrusted source image host');
  const ext=u.pathname.match(/\.(jpg|jpeg|png|webp)$/i)?.[0].toLowerCase()??'.jpg';
  if(process.env.DEALERTRADE_REMOTE_IMAGES==='1')return {url,sizeBytes:null,contentType:ext==='.png'?'image/png':ext==='.webp'?'image/webp':'image/jpeg'};
  const path='/media/dealertrade/'+createHash('sha256').update(url).digest('hex')+ext,file=resolve(root,'frontend/public',path.slice(1));
  return {url:existsSync(file)&&statSync(file).size>16?path:url,sizeBytes:existsSync(file)&&statSync(file).size>16?statSync(file).size:null,contentType:ext==='.png'?'image/png':ext==='.webp'?'image/webp':'image/jpeg'};
}
async function state(){
  const vehicles=await db.vehicle.findMany({include:{categories:{select:{id:true,slug:true}},images:true}});
  const dealers=await db.dealer.findMany({include:{branches:true}});
  const raw=await db.sourceFeedRecord.findMany({where:{source:'dealertrade'}});
  return {vehicles,dealers,raw,makes:await db.make.findMany(),models:await db.model.findMany(),variants:await db.variant.findMany({include:{specification:true}}),categories:await db.category.findMany()};
}
function scalarVehicle(v:Row){const {images,categories,...columns}=v;return json(columns);}
async function plan(){
  const rows:Row[]=read(resolve(source,'vehicles.json')),dealerRows:Row[]=read(resolve(source,'dealers.json'));
  const capture=read(resolve(source,'fetch-report.json')),metadataPayload=stockMetadata(capture);
  if(new Set(rows.map(r=>String(r.vehicle_id))).size!==rows.length)throw Error('Duplicate API identities');
  const s=await state(),rawMap=new Map(s.raw.map(r=>[r.kind+':'+r.externalId,r.payload]));
  const byExternal=new Map<string,typeof s.vehicles[number]>();
  for(const v of s.vehicles){const id=(v.sourceData as Row|null)?.vehicle_id;if(id){if(byExternal.has(String(id)))throw Error('Duplicate database identity '+id);byExternal.set(String(id),v);}}
  const dealers=new Map(s.dealers.map(d=>[d.id,d]));
  const makes=new Map(s.makes.map(m=>[m.slug,m])),models=new Map(s.models.map(m=>[m.makeId+':'+m.slug,m]));
  const catalogue:{kind:string;id:string;before:Row|null;data:Row}[]=[],dealerPlans:Row[]=[],vehiclePlans:Row[]=[],rawOnly:Row[]=[],issues:Row[]=[];
  const dealerCities=new Map<string,string>();
  for(const r of rows){const p=String(r.single_vehicle_url??'').split('/');if(p[2])dealerCities.set(String(r.dealer_id),decodeURIComponent(p[2]).replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()));}
  for(const r of dealerRows){
    const externalId=String(r.dealer_id),id=externalId,existing=dealers.get(id);
    const data:Row={};for(const [from,to]of Object.entries({dealer_name:'name',telephone:'phone',email:'email',address:'address',description:'description'}))if(!empty(r[from]))data[to]=r[from];
    if(!empty(r.province)){const province=provinceFromName(r.province);if(province)data.province=province;else issues.push({kind:'dealer',externalId,field:'province',reason:'Unrecognized API province retained in raw record'});}
    displayFields(data);
    const create=existing?undefined:{id,slug:`${slugify(r.dealer_name)}-fbook-${externalId}`,name:r.dealer_name,email:r.email||`dealertrade-${externalId}@example.invalid`,phone:r.telephone||'',address:r.address||'',province:data.province,city:dealerCities.get(externalId)||'',status:'APPROVED',approvedAt:new Date().toISOString(),...data};
    if(!existing&&(!create?.name||!create?.province)){issues.push({kind:'dealer',externalId,reason:'Required dealer identity/location missing'});continue;}
    if(create)displayFields(create);
    const before=rawMap.get('dealer:'+externalId),payload=mergeProvided(before,r),branchId=uuid('branch:'+externalId,'fbook');
    const branch=existing?.branches.find(b=>b.id===branchId),branchData:Row={};
    for(const key of ['name','phone','email','address','province'])if(data[key]!==undefined)branchData[key]=data[key];
    dealerPlans.push({externalId,id,before:existing?json({...existing,branches:undefined}):null,patch:existing?changedFields(json(existing),data):data,create,payload,rawBefore:before??null,branch:{id:branchId,before:branch?json(branch):null,patch:branch?changedFields(json(branch),branchData):branchData,create:branch?null:{id:branchId,dealerId:id,name:data.name,slug:'feed-head-office',address:data.address||'',city:existing?.city||create?.city||'',province:data.province,isHeadOffice:true,...branchData}}});
    if(!existing)dealers.set(id,{...create,...data,branches:[]}as any);
  }
  for(const r of rows){
    const externalId=String(r.vehicle_id),v=byExternal.get(externalId),dealerId=String(r.dealer_id),dealer=dealers.get(dealerId);
    const rawBefore=rawMap.get('vehicle:'+externalId),payload=mergeProvided(rawBefore,r);
    const oldSource=(v?.sourceData as Row|null)??{},sourceData={...oldSource,vehicle_id:externalId,dealertrade:mergeProvided(oldSource.dealertrade,r)};
    const before=v?scalarVehicle(v):null,patch:Row=sourceVehicleAttributes(r);
    const numeric:Row={price:'price',mileage:'mileage',engine_capacity:'engineCapacityCc',kilowatts:'powerKw',cylinders:'cylinders',no_seats:'seats',no_doors:'doors',image_count:'imageCount'};
    for(const [from,to]of Object.entries(numeric))if(!empty(r[from])){const value=integer(r[from],from==='price'?1:0);if(value!==undefined)patch[to as string]=value;else issues.push({kind:'vehicle',externalId,field:from,value:r[from],reason:'Cannot represent source value in constrained integer column; raw value retained'});}
    for(const [from,to]of Object.entries({title:'title',vin:'vin',registration_number:'registrationNumber'}))if(!empty(r[from]))patch[to]=r[from];
    patch.colour=standardColourName(r,v?.colour);
    if(!empty(r.featured)&&[0,1,false,true].includes(r.featured))patch.isFeatured=Boolean(r.featured);
    if(!empty(r.type)){const condition=({New:'NEW',Used:'USED',Demo:'DEMO'}as Row)[r.type];if(condition)patch.condition=condition;else issues.push({kind:'vehicle',externalId,field:'type',reason:'Unmapped condition; raw source retained'});}
    const transmission=({1:'MANUAL',2:'AUTOMATIC'}as Row)[r.transmission_type_id];if(transmission)patch.transmission=transmission;
    const drive=({'4X2':'4x2','4X4':'4x4',AWD:'AWD',FWD:'FWD',RWD:'RWD'}as Row)[r.driven_wheels];if(!empty(r.driven_wheels)&&drive)patch.drivetrain=drive;
    if(!empty(r.discount_price)){
      const value=integer(r.discount_price),price=patch.price??v?.price;
      if(value===0){patch.specialPrice=null;patch.isSpecial=false;}
      else if(value!==undefined&&price&&value<price){patch.specialPrice=value;patch.isSpecial=true;}
      else if(value!==undefined&&price&&value===price){patch.specialPrice=null;patch.isSpecial=false;}
      else issues.push({kind:'vehicle',externalId,field:'discount_price',reason:'Source discount violates the database promotional-price constraint; raw retained'});
    }
    if(!empty(r.stockno))patch.stockNumber=String(r.stockno);
    const p=String(r.single_vehicle_url??'').replace(/^https?:\/\/[^/]+\//,'').split('/');
    if(!empty(r.single_vehicle_url)){const province=provinceFromName(p[1]??'');if(province)patch.province=province;if(p[2])patch.city=decodeURIComponent(p[2]).replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}
    if(['comment','additional_information','extras'].some(k=>!empty(r[k]))){const merged=sourceData.dealertrade;patch.description=['comment','additional_information','extras'].map(k=>merged[k]).filter(x=>typeof x==='string'&&x.trim()).join('\n\n');}
    if(!empty(r.make_name)&&!empty(r.model_name)){
      const makeSlug=slugify(r.make_name);let make=makes.get(makeSlug);
      if(!make){make={id:uuid('make:'+makeSlug),slug:makeSlug,name:r.make_name}as any;makes.set(makeSlug,make!);catalogue.push({kind:'make',id:make!.id,before:null,data:{id:make!.id,name:titleCase(r.make_name),slug:makeSlug}});}
      const modelSlug=slugify(r.model_name),key=make!.id+':'+modelSlug;let model=models.get(key);
      if(!model){model={id:uuid('model:'+key),makeId:make!.id,slug:modelSlug,name:r.model_name}as any;models.set(key,model!);catalogue.push({kind:'model',id:model!.id,before:null,data:{id:model!.id,makeId:make!.id,name:titleCase(r.model_name),slug:modelSlug}});}
      patch.makeId=make!.id;patch.modelId=model!.id;
    }
    if(dealer){patch.dealerId=dealerId;patch.branchId=uuid('branch:'+r.dealer_id,'fbook');}
    const id=externalId;
    const gallery=!empty(r.photos)?r.photos.map((photo:string,position:number)=>({id:uuid(`image:${externalId}:${position}`),vehicleId:id,storageKey:`dealertrade/${externalId}/${position}`,...cachedImage(sourceUrl(sourceData.dealertrade,photo)),position,isPrimary:position===0,status:'READY'})):null;
    if(gallery?.length)patch.primaryImageUrl=gallery[0].url;
    const category=s.categories.find(c=>c.slug===resolveBodyType(sourceData.dealertrade)?.slugs[0]),categories=[...(category?[category.id]:[]),...(v?.categories.filter(c=>!BODY_TYPE_CATEGORY_SLUGS.includes(c.slug)).map(c=>c.id)??[])];
    if(!v){
      if(!dealer||!patch.makeId||!patch.modelId||!patch.condition||!patch.price){rawOnly.push({externalId,payload,rawBefore:rawBefore??null,reason:!dealer?'Dealer absent from source catalogue':'Required inventory values missing'});continue;}
      const create={id,slug:`${slugify([r.make_name,r.variant_name||r.model_name].filter(Boolean).join(' '))}-fbook-${externalId}`,stockNumber:externalId,title:[r.make_name,r.variant_name||r.model_name].filter(Boolean).join(' '),transmission:'UNKNOWN',fuelType:'OTHER',province:dealer.province,city:dealer.city,status:r.enabled===1&&r.removed===0?'PUBLISHED':'DRAFT',publishedAt:r.enabled===1&&r.removed===0?new Date().toISOString():null,...patch,sourceData};
      displayFields(create);
      vehiclePlans.push({externalId,id,before:null,create,patch:{},payload,rawBefore:rawBefore??null,gallery,categories,beforeImages:[],beforeProtectedImages:[],beforeCategories:[]});
    }else{
      displayFields(patch);
      patch.sourceData=sourceData;
      // A relation cannot retain a variant belonging to the previous model.
      if(patch.modelId!==undefined&&patch.modelId!==v.modelId&&v.variantId){patch.variantId=null;issues.push({kind:'vehicle',externalId,field:'variantId',reason:'Previous variant belongs to a different source model; association cleared for valid catalogue linkage'});}
      const beforeImages=gallery?v.images.filter(i=>!i.storageKey.startsWith('dealertrade/')&&!i.storageKey.startsWith('fbook/'+externalId+'-')):v.images;
      const beforeProtectedImages=gallery?v.images.filter(i=>i.storageKey.startsWith('dealertrade/')&&i.position<gallery.length).map(i=>({id:i.id,digest:protectedImage(i)})):[];
      vehiclePlans.push({externalId,id,before,patch:changedFields(before!,json(patch)),payload,rawBefore:rawBefore??null,gallery,categories,beforeImages:json(beforeImages),beforeProtectedImages,beforeCategories:v.categories.map(c=>c.id)});
    }
    if(vehiclePlans.length%5000===0)console.log(`Planned ${vehiclePlans.length}/${rows.length} source rows`);
  }
  // Shared catalogue names can only be overwritten when the source agrees.
  for(const kind of ['make','model']){
    const names=new Map<string,Set<string>>();
    for(const r of rows){if(empty(r.make_name)||empty(r.model_name))continue;const make=makes.get(slugify(r.make_name))!,entity=kind==='make'?make:models.get(make.id+':'+slugify(r.model_name))!;const set=names.get(entity.id)??new Set();set.add(kind==='make'?r.make_name:r.model_name);names.set(entity.id,set);}
    for(const [id,values]of names){const existing=(kind==='make'?s.makes:s.models).find(x=>x.id===id);if(!existing)continue;if(values.size===1){const name=titleCase([...values][0]);if(existing.name!==name)catalogue.push({kind,id,before:json(existing),data:{name}});}else issues.push({kind,externalId:id,field:'name',reason:'Source aliases conflict for one shared catalogue identity; each exact name retained per vehicle JSON'});}
  }
  const vehicleByExternal=new Map(vehiclePlans.map(v=>[v.externalId,v])),variantGroups=new Map<string,Row[]>();
  for(const r of rows){const v=vehicleByExternal.get(String(r.vehicle_id));if(!v||empty(r.model_variant_id))continue;const modelId=v.create?.modelId??v.patch.modelId??v.before.modelId,key=modelId+':'+r.model_variant_id;const group=variantGroups.get(key)??[];group.push(r);variantGroups.set(key,group);}
  const variantPlans:Row[]=[];
  for(const [key,group]of variantGroups){
    const r=group[0],vehicle=vehicleByExternal.get(String(r.vehicle_id))!,modelId=vehicle.create?.modelId??vehicle.patch.modelId??vehicle.before.modelId;
    const existing=s.variants.find(v=>v.modelId===modelId&&((v.specification?.extra as Row|null)?.model_variant_id===r.model_variant_id||v.slug.endsWith('-dealertrade-'+r.model_variant_id)));
    const names=[...new Set(group.map(x=>x.variant_name).filter(x=>!empty(x)))],dates=[...new Set(group.map(x=>x.introduction_date).filter(x=>!empty(x)))];
    const date=dates.length===1&&/^(19|20)\d{2}-\d{2}-\d{2}$/.test(dates[0])?dates[0]:null;
    const parsed=date?new Date(date+'T00:00:00Z'):null,validDate=parsed&&!Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===date;
    if(!existing&&(!validDate||names.length!==1)){issues.push({kind:'variant',externalId:String(r.model_variant_id),field:'variantId',reason:'Cannot create a variant without a valid source introduction year and consistent name; complete per-car API values retained in JSON'});continue;}
    const id=existing?.id??uuid('variant:'+key),data:Row={};if(names.length===1)data.name=titleCase(names[0]);if(validDate)data.yearFrom=Number(date!.slice(0,4));
    const create=existing?null:{id,modelId,name:titleCase(names[0]),slug:`${slugify(names[0])}-dealertrade-${r.model_variant_id}`,yearFrom:data.yearFrom};
    const {specification,...variantColumns}=existing??{};
    const spec:Row={};
    for(const [from,to]of Object.entries({engine_capacity:'engineCapacityCc',kilowatts:'powerKw',cylinders:'cylinders',no_seats:'seats',no_doors:'doors',no_gears:'gears',fuel_tank_size:'fuelTankLitres'})){
      const values=[...new Set(group.map(x=>x[from]).filter(x=>!empty(x)).map(x=>integer(x)))];
      if(values.length===1&&values[0]!==undefined)spec[to]=values[0];else if(values.length>1)issues.push({kind:'variant',externalId:String(r.model_variant_id),field:from,reason:'Conflicting shared specifications retained on individual vehicle rows/JSON; existing shared value preserved'});
    }
    const transmissions=[...new Set(group.map(x=>({1:'MANUAL',2:'AUTOMATIC'}as Row)[x.transmission_type_id]).filter(Boolean))];if(transmissions.length===1)spec.transmission=transmissions[0];
    const drives=[...new Set(group.map(x=>({'4X2':'4x2','4X4':'4x4',AWD:'AWD',FWD:'FWD',RWD:'RWD'}as Row)[x.driven_wheels]).filter(Boolean))];if(drives.length===1)spec.drivetrain=drives[0];
    spec.extra=mergeProvided(specification?.extra,{source:'dealertrade',model_variant_id:r.model_variant_id,...(validDate?{introduction_date:date}:{})});
    variantPlans.push({id,before:existing?json(variantColumns):null,create,patch:existing?changedFields(json(variantColumns),data):{},specBefore:specification?json(specification):null,specPatch:specification?changedFields(json(specification),spec):spec});
    for(const sourceRow of group){const v=vehicleByExternal.get(String(sourceRow.vehicle_id))!;if(v.create)v.create.variantId=id;else if(v.before.variantId!==id)v.patch.variantId=id;}
  }
  const plannedIds=new Set(vehiclePlans.map(v=>v.id));
  const rawKeys=new Set([...rows.map(r=>'vehicle:'+r.vehicle_id),...dealerRows.map(r=>'dealer:'+r.dealer_id)]),dealerIds=new Set(dealerPlans.map(d=>d.id));
  const result={metadataPayload,createdAt:new Date().toISOString(),policy:'API nonempty values win; null/blank/empty collections preserve existing data; zero and false are nonempty. Missing source rows are untouched.',capture,catalogue,dealerPlans,vehiclePlans,variantPlans,rawOnly,issues,untouchedRaw:json(s.raw.filter(r=>!rawKeys.has(r.kind+':'+r.externalId)&&!(metadataPayload&&r.kind==='metadata'&&r.externalId==='stock'))),untouchedDealers:json(s.dealers.filter(d=>!dealerIds.has(d.id))),untouched:s.vehicles.filter(v=>!plannedIds.has(v.id)).map(v=>({id:v.id,before:scalarVehicle(v),images:json(v.images),categories:v.categories.map(c=>c.id)}))};
  const fd=openSync(resolve(dir,'vehicle-plans.ndjson'),'w');for(const v of vehiclePlans)writeSync(fd,JSON.stringify(v)+'\n');closeSync(fd);
  writeFileSync(planFile,JSON.stringify({...result,vehiclePlans:undefined,vehiclePlansFile:'vehicle-plans.ndjson'}));
  const changeRows:Row[]=[];
  for(const v of vehiclePlans){for(const [field,value]of Object.entries(v.before?v.patch:v.create)){if(field==='sourceData')continue;changeRows.push({kind:'vehicle',externalId:v.externalId,field,before:v.before?.[field]??null,after:value});}for(const [field,value]of Object.entries(v.payload))if(!isDeepStrictEqual(v.rawBefore?.[field],value))changeRows.push({kind:'raw_vehicle',externalId:v.externalId,field,before:v.rawBefore?.[field]??null,after:value});}
  writeFileSync(resolve(dir,'changes.ndjson'),changeRows.map(r=>JSON.stringify(r)).join('\n')+'\n');
  writeFileSync(resolve(dir,'changes.csv'),'kind,external_id,field,before,after\n'+changeRows.map(r=>[r.kind,r.externalId,r.field,JSON.stringify(r.before),JSON.stringify(r.after)].map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n')+'\n');
  const changes=vehiclePlans.filter(p=>!p.before||Object.keys(p.patch).length);
  const columns:Row={};for(const p of vehiclePlans)for(const key of Object.keys(p.patch))columns[key]=(columns[key]??0)+1;
  const summary={at:result.createdAt,apiRows:rows.length,apiDealers:dealerRows.length,matched:vehiclePlans.filter(p=>p.before).length,newVehicles:vehiclePlans.filter(p=>!p.before).length,vehicleRowsWithChanges:changes.length,changedColumns:columns,variants:variantPlans.length,rawOnly:rawOnly.length,untouchedVehicles:result.untouched.length,issues:issues.length,issuesByField:issues.reduce((a:Row,r:Row)=>{const k=r.field??'row';a[k]=(a[k]??0)+1;return a;},{})};
  write('plan-summary.json',summary);console.log(summary);
}

async function rawUpsert(tx:any,kind:string,p:Row){
  await tx.sourceFeedRecord.upsert({where:{source_kind_externalId:{source:'dealertrade',kind,externalId:p.externalId}},create:{source:'dealertrade',kind,externalId:p.externalId,payload:p.payload},update:{payload:p.payload,fetchedAt:new Date()}});
}
async function apply(){
  const p=await loadPlan(),failures:Row[]=[];let updated=0,created=0;
  if(createHash('sha256').update(readFileSync(resolve(source,'vehicles.json'))).digest('hex')!==p.capture.vehiclesSha256)throw Error('API source file changed after plan generation');
  for(const c of p.catalogue){if(c.kind==='make'){if(c.before)await db.make.update({where:{id:c.id},data:c.data});else await db.make.upsert({where:{id:c.id},create:c.data,update:{}});}else{if(c.before)await db.model.update({where:{id:c.id},data:c.data});else await db.model.upsert({where:{id:c.id},create:c.data,update:{}});}}
  for(const d of p.dealerPlans)await db.$transaction(async tx=>{
    if(!d.before)await tx.dealer.create({data:d.create});
    if(d.before&&Object.keys(d.patch).length){const result=await tx.dealer.updateMany({where:{id:d.id,updatedAt:new Date(d.before.updatedAt)},data:d.patch});if(result.count!==1)throw Error('Dealer changed after plan '+d.externalId);}
    const b=d.branch;if(!b.before)await tx.branch.create({data:b.create});else if(Object.keys(b.patch).length)await tx.branch.update({where:{id:b.id},data:b.patch});
    await rawUpsert(tx,'dealer',d);
  });
  for(const v of p.variantPlans){
    if(v.create)await db.variant.upsert({where:{id:v.id},create:v.create,update:{}});else if(Object.keys(v.patch).length)await db.variant.update({where:{id:v.id},data:v.patch});
    if(v.specBefore){if(Object.keys(v.specPatch).length)await db.variantSpecification.update({where:{variantId:v.id},data:v.specPatch});}else await db.variantSpecification.create({data:{variantId:v.id,...v.specPatch}});
  }
  let cursor=0,done=0;
  await Promise.all(Array.from({length:6},async()=>{while(cursor<p.vehiclePlans.length){const v=p.vehiclePlans[cursor++];try{
    await db.$transaction(async tx=>{
      if(!v.before)await tx.vehicle.create({data:v.create});
      else if(Object.keys(v.patch).length){const result=await tx.vehicle.updateMany({where:{id:v.id,version:v.before.version},data:{...v.patch,version:{increment:1}}});if(result.count!==1)throw Error('Vehicle changed after plan');}
      if(v.categories&&!isDeepStrictEqual([...v.categories].sort(),[...v.beforeCategories].sort()))await tx.vehicle.update({where:{id:v.id},data:{categories:{set:v.categories.map((id:string)=>({id}))}}});
      if(v.gallery){
        const data=JSON.stringify(v.gallery);
        await tx.$executeRaw`INSERT INTO vehicle_images (id,"vehicleId","storageKey",url,"sizeBytes","contentType",position,"isPrimary",status,"updatedAt") SELECT i.id,i."vehicleId",i."storageKey",i.url,i."sizeBytes",i."contentType",i.position,i."isPrimary",'READY'::"ImageStatus",NOW() FROM jsonb_to_recordset(${data}::jsonb) AS i(id uuid,"vehicleId" text,"storageKey" text,url text,"sizeBytes" int,"contentType" text,position int,"isPrimary" boolean) ON CONFLICT ("storageKey") DO UPDATE SET url=EXCLUDED.url,"sizeBytes"=EXCLUDED."sizeBytes","contentType"=EXCLUDED."contentType",position=EXCLUDED.position,"isPrimary"=EXCLUDED."isPrimary","updatedAt"=NOW() WHERE (vehicle_images.url,vehicle_images."sizeBytes",vehicle_images."contentType",vehicle_images.position,vehicle_images."isPrimary") IS DISTINCT FROM (EXCLUDED.url,EXCLUDED."sizeBytes",EXCLUDED."contentType",EXCLUDED.position,EXCLUDED."isPrimary")`;
        await tx.vehicleImage.deleteMany({where:{vehicleId:v.id,OR:[{storageKey:{startsWith:`fbook/${v.externalId}-`}},{storageKey:{startsWith:`dealertrade/${v.externalId}/`},position:{gte:v.gallery.length}}]}});
      }
      await rawUpsert(tx,'vehicle',v);
    },{timeout:30000});if(!v.before)created++;else if(Object.keys(v.patch).length)updated++;
  }catch(e){failures.push({externalId:v.externalId,error:String(e)});if(failures.length===1)console.error(e);}
  done++;if(done%2000===0)console.log(`Reconciled ${done}/${p.vehiclePlans.length}; failures=${failures.length}`);
  }}));
  for(const r of p.rawOnly)await rawUpsert(db,'vehicle',r);
  const report={at:new Date().toISOString(),updated,created,processed:p.vehiclePlans.length,rawOnly:p.rawOnly.length,failures};write('apply-report.json',report);console.log({...report,failures:failures.length});if(failures.length)throw Error('Some rows failed; see apply-report.json');
  if(p.metadataPayload)await rawUpsert(db,'metadata',{externalId:'stock',payload:p.metadataPayload});
}
async function verify(){
  const p=await loadPlan(),s=await state(),vehicles=new Map(s.vehicles.map(v=>[v.id,v])),raw=new Map(s.raw.map(r=>[r.kind+':'+r.externalId,r.payload])),dealers=new Map(s.dealers.map(d=>[d.id,d]));
  const mismatches:Row[]=[],check=(kind:string,id:string,field:string,expected:any,actual:any)=>{if(!isDeepStrictEqual(json(expected??null),json(actual??null)))mismatches.push({kind,id,field,expected,actual});};
  let columns=0,preserved=0,photos=0,apiValues=0,emptyApiPreserved=0;
  const sourceValues=(kind:string,id:string,before:any,incoming:any,actual:any,path='')=>{
    if(empty(incoming)){check(kind,id,path,before===undefined?incoming:before,actual);emptyApiPreserved++;return;}
    if(typeof incoming==='object'&&!Array.isArray(incoming)){for(const [k,value]of Object.entries(incoming))sourceValues(kind,id,before?.[k],value,actual?.[k],path?path+'.'+k:k);return;}
    check(kind,id,path,incoming,actual);apiValues++;
  };
  const inputRows:Row[]=read(resolve(source,'vehicles.json')),inputDealers:Row[]=read(resolve(source,'dealers.json'));
  const plannedRaw=new Map([...p.vehiclePlans,...p.rawOnly].map((r:Row)=>[r.externalId,r]));
  for(const input of inputRows){
    const id=String(input.vehicle_id),planned=plannedRaw.get(id)as Row;sourceValues('api_value',id,planned.rawBefore,input,raw.get('vehicle:'+id));
    const v=vehicles.get(planned.id);if(!v)continue;
    for(const [from,to]of Object.entries({price:'price',mileage:'mileage',engine_capacity:'engineCapacityCc',kilowatts:'powerKw',cylinders:'cylinders',no_seats:'seats',no_doors:'doors',image_count:'imageCount'})){if(empty(input[from]))continue;const n=integer(input[from],from==='price'?1:0);if(n!==undefined)check('direct_api_column',id,to,n,(v as Row)[to]);}
    if(!empty(input.stockno))check('direct_api_column',id,'stockNumber',String(input.stockno),v.stockNumber);
    if(!empty(input.featured)&&[0,1,false,true].includes(input.featured))check('direct_api_column',id,'isFeatured',Boolean(input.featured),v.isFeatured);
    const transmission=({1:'MANUAL',2:'AUTOMATIC'}as Row)[input.transmission_type_id];if(transmission)check('direct_api_column',id,'transmission',transmission,v.transmission);
    const condition=({New:'NEW',Used:'USED',Demo:'DEMO'}as Row)[input.type];if(condition)check('direct_api_column',id,'condition',condition,v.condition);
  }
  const plannedDealers=new Map(p.dealerPlans.map((r:Row)=>[r.externalId,r]));
  for(const input of inputDealers){const id=String(input.dealer_id),planned=plannedDealers.get(id)as Row;if(planned)sourceValues('api_dealer_value',id,planned.rawBefore,input,raw.get('dealer:'+id));}
  for(const item of p.vehiclePlans){const v=vehicles.get(item.id);if(!v){mismatches.push({id:item.id,field:'vehicle',reason:'missing'});continue;}
    const actual=scalarVehicle(v),expected=item.before?{...item.before,...item.patch}:item.create;
    for(const [field,value]of Object.entries(expected)){if(['version','updatedAt'].includes(field))continue;check('vehicle',item.externalId,field,value,actual[field]);columns++;if(item.before&&!Object.hasOwn(item.patch,field))preserved++;}
    check('raw_vehicle',item.externalId,'payload',item.payload,raw.get('vehicle:'+item.externalId));
    if(item.categories)check('vehicle',item.externalId,'categories',[...item.categories].sort(),v.categories.map(c=>c.id).sort());else check('vehicle',item.externalId,'categories',item.beforeCategories.sort(),v.categories.map(c=>c.id).sort());
    if(item.gallery){const images=v.images.filter(i=>i.storageKey.startsWith('dealertrade/')).sort((a,b)=>a.position-b.position);check('vehicle',item.externalId,'galleryLength',item.gallery.length,images.length);for(const image of item.gallery){const actualImage=images.find(i=>i.position===image.position);for(const field of ['url','sizeBytes','contentType','position','isPrimary'])check('image',item.externalId,field+':'+image.position,image[field],(actualImage as Row|undefined)?.[field]);photos++;}}
    else check('vehicle',item.externalId,'emptyApiPhotosPreserved',[...item.beforeImages].sort((a,b)=>a.id.localeCompare(b.id)),json(v.images).sort((a:Row,b:Row)=>a.id.localeCompare(b.id)));
    const custom=(images:Row[])=>images.filter(i=>!i.storageKey.startsWith('dealertrade/')&&!i.storageKey.startsWith('fbook/'+item.externalId+'-')).sort((a,b)=>a.id.localeCompare(b.id));check('vehicle',item.externalId,'customImagesPreserved',custom(item.beforeImages),custom(json(v.images)));
    const imageById=new Map(v.images.map(i=>[i.id,i]));for(const image of item.beforeProtectedImages){const actualImage=imageById.get(image.id);check('image',item.externalId,'protectedColumns:'+image.id,image.digest,actualImage?protectedImage(actualImage):null);}
  }
  for(const d of p.dealerPlans){const actual=dealers.get(d.id);if(!actual){mismatches.push({id:d.id,field:'dealer',reason:'missing'});continue;}const expected=d.before?{...d.before,...d.patch}:d.create;for(const [field,value]of Object.entries(expected))if(!['updatedAt'].includes(field)){check('dealer',d.externalId,field,value,(actual as Row)[field]);columns++;}const branch=actual.branches.find(b=>b.id===d.branch.id),expectedBranch=d.branch.before?{...d.branch.before,...d.branch.patch}:d.branch.create;for(const [field,value]of Object.entries(expectedBranch))if(field!=='updatedAt'){check('branch',d.externalId,field,value,(branch as Row|undefined)?.[field]);columns++;}check('raw_dealer',d.externalId,'payload',d.payload,raw.get('dealer:'+d.externalId));}
  for(const c of p.catalogue){const entity=(c.kind==='make'?s.makes:s.models).find(x=>x.id===c.id),expected={...(c.before??{}),...c.data};for(const [field,value]of Object.entries(expected))if(field!=='updatedAt')check('catalogue',c.id,field,value,(entity as Row|undefined)?.[field]);}
  for(const item of p.variantPlans){const v=s.variants.find(x=>x.id===item.id),expected=item.before?{...item.before,...item.patch}:item.create;for(const [field,value]of Object.entries(expected))if(field!=='updatedAt')check('variant',item.id,field,value,(v as Row|undefined)?.[field]);const spec=item.specBefore?{...item.specBefore,...item.specPatch}:item.specPatch;for(const [field,value]of Object.entries(spec))if(field!=='updatedAt')check('variant_specification',item.id,field,value,(v?.specification as Row|undefined)?.[field]);}
  if(p.metadataPayload)check('metadata','stock','payload',p.metadataPayload,raw.get('metadata:stock'));
  for(const r of p.rawOnly)check('raw_vehicle',r.externalId,'payload',r.payload,raw.get('vehicle:'+r.externalId));
  const fullRaw=new Map(s.raw.map(r=>[r.kind+':'+r.externalId,json(r)]));for(const r of p.untouchedRaw)check('unobserved_raw',r.externalId,'allColumns',r,fullRaw.get(r.kind+':'+r.externalId));
  for(const d of p.untouchedDealers){const actual=dealers.get(d.id);check('unobserved_dealer',d.id,'allColumnsAndBranches',d,actual?json(actual):null);}
  for(const item of p.untouched){const v=vehicles.get(item.id);check('untouched_vehicle',item.id,'allColumns',item.before,v?scalarVehicle(v):null);if(v){check('untouched_vehicle',item.id,'images',item.images.sort((a:Row,b:Row)=>a.id.localeCompare(b.id)),json(v.images).sort((a:Row,b:Row)=>a.id.localeCompare(b.id)));check('untouched_vehicle',item.id,'categories',item.categories.sort(),v.categories.map(c=>c.id).sort());}}
  const report={at:new Date().toISOString(),apiRows:p.vehiclePlans.length+p.rawOnly.length,inventoryRowsVerified:p.vehiclePlans.length,rawOnly:p.rawOnly.length,dealerRowsVerified:p.dealerPlans.length,apiProvidedValuesChecked:apiValues,emptyApiPreservationChecks:emptyApiPreserved,normalizedColumnsChecked:columns,preservedColumnChecks:preserved,galleryReferencesChecked:photos,unobservedRowsPreserved:p.untouched.length,mismatches:mismatches.length,issues:p.issues.length};write('verification-report.json',report);write('verification-mismatches.json',mismatches);console.log(report);if(mismatches.length)throw Error('Verification found mismatches');
}
(mode==='--plan'?plan():mode==='--apply'?apply():mode==='--verify'?verify():Promise.reject(Error('Use --plan, --apply or --verify'))).catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>db.$disconnect());
