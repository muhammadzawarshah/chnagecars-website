import { BODY_TYPE_CATEGORY_SLUGS, resolveBodyType } from '../src/modules/vehicles/body-type-mapping';
/** Idempotent DealerTrade import. Exact external IDs only; no guessed specifications. */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma, Province, VehicleCondition, Drivetrain } from '../src/generated/prisma/client';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { provinceFromName, slugify } from '../src/modules/web/web-format';

type Row = Record<string, any>;
const strictSource = process.env.DEALERTRADE_STRICT_SOURCE === '1';
const dir = resolve(process.env.DEALERTRADE_IMPORT_DIR || resolve(__dirname, '../.local/dealertrade'));
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 12 }) });
const uuid = (key: string, source = 'dealertrade') => {
  const h = createHash('sha256').update(`changecars-${source}:${key}`).digest('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
};
const positive = (n: unknown): number | undefined => {
  if (n === null || n === undefined || n === '') return undefined;
  const v = Number(n); return Number.isSafeInteger(v) && v > 0 ? v : undefined;
};
const imageUrl = (r: Row, p: string) => p.startsWith('https://') ? p : r.cdn_url.replace(/\/$/, '') + '/' + p.replace(/^\//, '');
const localImage = (url: string) => {
  const u = new URL(url);
  if (u.protocol !== 'https:' || u.hostname !== 'www.changecars.co.za') throw Error('Unexpected image URL');
  const extension = u.pathname.match(/\.(jpg|jpeg|png|webp)$/i)?.[0].toLowerCase() ?? '.jpg';
  const relative = '/media/dealertrade/' + createHash('sha256').update(url).digest('hex') + extension;
  const file = resolve(__dirname, '../../public', relative.slice(1));
  return existsSync(file) && statSync(file).size > 16 ? { url: relative, size: statSync(file).size } : { url, size: null };
};
const location = (r: Row) => {
  const parts = String(r.single_vehicle_url ?? '').replace(/^https?:\/\/[^/]+\//, '').split('/');
  return { province: provinceFromName(parts[1] ?? ''), city: parts[2] ? decodeURIComponent(parts[2]).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : undefined, body: parts[3] };
};

async function snapshots(kind: string, rows: Row[], key: string) {
  for (let i = 0; i < rows.length; i += 500) {
    const data = JSON.stringify(rows.slice(i,i+500).map(r => ({ externalId: String(r[key]), payload: r })));
    await db.$executeRaw`INSERT INTO source_feed_records (source,kind,"externalId",payload,"fetchedAt")
      SELECT 'dealertrade',${kind},r."externalId",r.payload,NOW()
      FROM jsonb_to_recordset(${data}::jsonb) AS r("externalId" text,payload jsonb)
      ON CONFLICT (source,kind,"externalId") DO UPDATE SET payload=EXCLUDED.payload,"fetchedAt"=EXCLUDED."fetchedAt"`;
  }
}

async function main() {
  if (strictSource) {
    const connection = new URL(process.env.DATABASE_URL!);
    if (connection.hostname !== '127.0.0.1' || connection.port !== '55432' || !/^\/changecars_strict_stage_/.test(connection.pathname)) throw Error('Strict rebuild requires an isolated local staging database');
    if (await db.vehicle.count() || await db.dealer.count()) throw Error('Strict rebuild stage must have empty inventory and dealers');
  }
  const preservedSlugs = strictSource && existsSync(resolve(dir, 'preserved-slugs.json')) ? new Map<string,string>(JSON.parse(readFileSync(resolve(dir, 'preserved-slugs.json'), 'utf8')).map((row: Row) => [row.id, row.slug])) : new Map<string,string>();
  const preservedDealerSlugs = strictSource && existsSync(resolve(dir, 'preserved-dealer-slugs.json')) ? new Map<string,string>(JSON.parse(readFileSync(resolve(dir, 'preserved-dealer-slugs.json'), 'utf8')).map((row: Row) => [row.id, row.slug])) : new Map<string,string>();
  const dealers: Row[] = JSON.parse(readFileSync(resolve(dir,'dealers-all.json'),'utf8'));
  const stock: Row[] = JSON.parse(readFileSync(resolve(dir,'stock-all.json'),'utf8'));
  for (const [rows,key] of [[dealers,'dealer_id'],[stock,'vehicle_id']] as const) {
    if (!rows.length || new Set(rows.map(r => String(r[key]))).size !== rows.length) throw Error(`Empty or duplicate ${key}`);
  }
  if (process.env.DEALERTRADE_NEW_ONLY === '1') {
    const connection = new URL(process.env.DATABASE_URL!);
    if (connection.hostname !== '127.0.0.1' || connection.port !== '55432') throw Error('New-only import is local-only');
    if (await db.vehicle.count({ where: { id: { in: stock.map(r => String(r.vehicle_id)) } } })) throw Error('New-only input contains existing vehicles');
    if (await db.dealer.count({ where: { id: { in: dealers.map(r => String(r.dealer_id)) } } })) throw Error('New-only input contains existing dealers');
  }
  await snapshots('dealer',dealers,'dealer_id');
  await snapshots('vehicle',stock,'vehicle_id');
  if (process.argv.includes('--snapshots-only')) { console.log({ dealers:dealers.length, vehicles:stock.length }); return; }
  const old = await db.vehicle.findMany({select:{id:true,sourceData:true,colour:true,year:true,mileage:true,condition:true,province:true,city:true,dealerId:true,branchId:true,transmission:true,fuelType:true,drivetrain:true,engineCapacityCc:true,powerKw:true,cylinders:true,seats:true,doors:true,primaryImageUrl:true,status:true,categories:{select:{id:true,slug:true}}}});
  const byExternal = new Map<string,typeof old[number]>();
  for (const v of old) {
    const data = v.sourceData as Row | null;
    if (!data?.vehicle_id) continue;
    const key = String(data.vehicle_id);
    if (byExternal.has(key)) throw Error(`Ambiguous database source ID ${key}`);
    byExternal.set(key,v);
  }
  const oldDealers = new Map((await db.dealer.findMany()).map(d=>[d.id,d]));
  const dealerMap = new Map<string,{id:string;branchId:string;province:Province;city:string;raw:Row}>();
  const dealerCities = new Map<string,string>();
  for (const r of stock) { const l=location(r); if(l.city) dealerCities.set(String(r.dealer_id),l.city); }
  const issues: Row[] = [];
  for (const r of dealers) {
    const key=String(r.dealer_id), id=key, branchId=uuid(`branch:${key}`,'fbook');
    const existing=oldDealers.get(id), province=provinceFromName(typeof r.province === 'string' ? r.province : '');
    if (!province || typeof r.dealer_name !== 'string' || !r.dealer_name.trim()) {issues.push({dealerId:key,reason:!province ? 'Unknown province; raw record retained' : 'Missing dealer name; raw record retained'});continue;}
    const city=existing?.city || dealerCities.get(key) || '';
    if(!city) issues.push({dealerId:key,reason:'Dealer city not supplied; left empty'});
    const data={logoUrl: strictSource && r.dealer_image ? new URL('images/200/' + String(r.dealer_image).replace(/^\//, ''), 'https://www.changecars.co.za/').href : undefined,name:r.dealer_name,phone:r.telephone || existing?.phone || '',email:strictSource ? (r.email ?? '') : r.email || existing?.email || `dealertrade-${key}@example.invalid`,address:r.address,province,city,description:r.description || existing?.description};
    await db.dealer.upsert({where:{id},create:{id,...data,slug:preservedDealerSlugs.get(key) ?? `${slugify(r.dealer_name)}-${strictSource ? 'dealertrade' : 'fbook'}-${key}`,status:'APPROVED',approvedAt:new Date()},update:data});
    const branch={dealerId:id,name:r.dealer_name,phone:data.phone,email:r.email || null,address:r.address,province,city,isHeadOffice:true};
    await db.branch.upsert({where:{id:branchId},create:{id:branchId,...branch,slug:'feed-head-office'},update:branch});
    dealerMap.set(key,{id,branchId,province,city,raw:r});
  }
  // Some stock dealers are omitted from the API dealer list. Reuse the exact
  // prior feed identity where available; never attach their cars to another dealer.
  for(const r of stock){
    const key=String(r.dealer_id);if(dealerMap.has(key))continue;
    const id=key,existing=oldDealers.get(id);
    if(existing)dealerMap.set(key,{id,branchId:uuid(`branch:${key}`,'fbook'),province:existing.province,city:existing.city,raw:{dealer_id:r.dealer_id,provenance:'previous-import',dealer_name:existing.name}});
  }
  const makes=new Map<string,string>(), models=new Map<string,{makeId:string;modelId:string}>();
  for(const r of stock) {
    if(!r.make_name || !r.model_name) continue;
    const makeSlug=slugify(r.make_name), key=makeSlug+':'+slugify(r.model_name);
    if(models.has(key))continue;
    let makeId=makes.get(makeSlug);
    if(!makeId){const m=await db.make.upsert({where:{slug:makeSlug},create:{name:r.make_name,slug:makeSlug},update:strictSource ? {name:r.make_name} : {}});makeId=m.id;makes.set(makeSlug,makeId);}
    const m=await db.model.upsert({where:{makeId_slug:{makeId,slug:slugify(r.model_name)}},create:{makeId,name:r.model_name,slug:slugify(r.model_name)},update:strictSource ? {name:r.model_name} : {}});
    models.set(key,{makeId,modelId:m.id});
  }
  const categories=new Map((await db.category.findMany()).map(c=>[c.slug,c.id]));
  const bodies:Record<string,string>={'suv':'suvs','sedan':'sedans','hatchback':'hatchbacks','coupe':'coupes','convertible':'convertibles','crossover':'crossovers','mpv':'mpvs','panel-van':'panel-vans','double-cab':'double-cabs','double-cab-bakkie':'double-cabs','single-cab':'single-cabs','single-cab-bakkie':'single-cabs','extended-cab':'king-cabs','minibus':'minibuses','motorbike':'motorbikes','bakkie':'bakkies','station-wagon':'station-wagons'};
  let cursor=0, imported=0, created=0, photos=0;
  const missing={year:0,colour:0,fuel:0,transmission:0};
  const failures:Row[]=[];
  await Promise.all(Array.from({length:8},async()=>{
    while(cursor<stock.length){
      const r=stock[cursor++], key=String(r.vehicle_id), previous=byExternal.get(key), dealer=dealerMap.get(String(r.dealer_id));
      try{
        const cat=models.get(slugify(r.make_name ?? '')+':'+slugify(r.model_name ?? ''));
        const condition=({New:'NEW',Used:'USED',Demo:'DEMO'} as Record<string,VehicleCondition>)[r.type] ?? previous?.condition;
        const price=positive(r.price);
        if(!dealer || !cat || !condition || !price) {issues.push({vehicleId:key,reason:!price?'Missing/POA/nonpositive price; raw record retained':!dealer?'Dealer absent from feed':!cat?'Missing make/model':'Unknown condition'});continue;}
        const l=location(r), source=(previous?.sourceData as Row|null) ?? {};
        const sourceYear = positive(r.model_year);
        const year=sourceYear && Number.isInteger(sourceYear) && sourceYear>=1900 && sourceYear<=2100 ? sourceYear : strictSource ? null : previous?.year ?? (positive(source.year) && Number(source.year)>=1900 && Number(source.year)<=2100 ? Number(source.year) : null);
        const colour=previous?.colour || source.exterior_color || null;
        const transmission=({1:'MANUAL',2:'AUTOMATIC'} as const)[r.transmission_type_id as 1|2] ?? previous?.transmission ?? 'UNKNOWN';
        const fuelType=strictSource ? ({1:'PETROL',2:'DIESEL',3:'ELECTRIC',4:'HYBRID'} as const)[r.fuel_type_id as 1|2|3|4] ?? 'OTHER' : previous?.fuelType ?? 'OTHER'; // Explicit source ID mapping; unknown IDs retain OTHER plus the untouched raw ID.
        const drivetrain=({ '4X2':'FOUR_X_TWO','4X4':'FOUR_X_FOUR','AWD':'AWD','FWD':'FWD','RWD':'RWD' } as Record<string,Drivetrain>)[r.driven_wheels] ?? previous?.drivetrain ?? null;
        const id=key;
        const images=(r.photos ?? []).map((p:string,position:number)=>{
          const sourceUrl=imageUrl(r,p), local=strictSource ? {url:sourceUrl,size:null} : localImage(sourceUrl);
          return {id:uuid(`image:${key}:${position}`),vehicleId:id,storageKey:`dealertrade/${key}/${position}`,url:local.url,sizeBytes:local.size,contentType:/\.png$/i.test(sourceUrl)?'image/png':/\.webp$/i.test(sourceUrl)?'image/webp':'image/jpeg',position,isPrimary:position===0,status:'READY',altText:[year,r.make_name,r.variant_name||r.model_name].filter(Boolean).join(' ')};
        });
        const discount=positive(r.discount_price), title=[year,r.make_name,r.variant_name||r.model_name].filter(Boolean).join(' ');
        const mileage=r.mileage!==null && r.mileage!=='' && Number.isSafeInteger(Number(r.mileage)) && Number(r.mileage)>=0 ? Number(r.mileage) : previous?.mileage ?? null;
        const data={isFeatured:strictSource ? r.featured===1 : undefined,dealerId:dealer.id,branchId:dealer.branchId,...cat,stockNumber:strictSource ? (r.stockno == null || r.stockno === '' ? null : String(r.stockno)) : key,title,year,colour,mileage,price,specialPrice:discount && discount<price?discount:null,isSpecial:!!discount&&discount<price,condition,
          transmission,fuelType,drivetrain,engineCapacityCc:positive(r.engine_capacity) ?? previous?.engineCapacityCc ?? null,powerKw:positive(r.kilowatts) ?? previous?.powerKw ?? null,cylinders:positive(r.cylinders) ?? previous?.cylinders ?? null,seats:positive(r.no_seats) ?? previous?.seats ?? null,doors:positive(r.no_doors) ?? previous?.doors ?? null,
          province:l.province ?? previous?.province ?? dealer.province,city:l.city ?? previous?.city ?? dealer.city,
          primaryImageUrl:images[0]?.url ?? previous?.primaryImageUrl ?? null,imageCount:images.length,
          sourceData:{...source,...(strictSource ? {importPolicy:'dealertrade-only'} : {}),vehicle_id:key,dealertrade:r,dealertradeDealer:dealer.raw} as Prisma.InputJsonValue,
          description:[r.comment,r.additional_information,r.extras].filter(v=>typeof v==='string'&&v.trim()).join('\n\n') || undefined};
        const category=categories.get(resolveBodyType(r)?.slugs[0] ?? '');
        const bodyCategories=[...(category?[{id:category}]:[]),...(previous?.categories.filter(c=>!BODY_TYPE_CATEGORY_SLUGS.includes(c.slug)).map(c=>({id:c.id}))??[])];
        await db.$transaction(async tx=>{
          await tx.vehicle.upsert({where:{id},create:{id,...data,slug:preservedSlugs.get(key) ?? `${slugify(title)}-${strictSource ? 'dealertrade' : 'fbook'}-${key}`,status:r.enabled===1&&r.removed===0?'PUBLISHED':'DRAFT',publishedAt:r.enabled===1&&r.removed===0?new Date():null,categories:{connect:bodyCategories}},update:{...data,categories:{set:bodyCategories},...((r.enabled!==1||r.removed!==0)&&previous?.status==='PUBLISHED'?{status:'ARCHIVED',archivedAt:new Date()}:{}),version:{increment:1}}});
          if(images.length){
            const json=JSON.stringify(images);
            await tx.$executeRaw`INSERT INTO vehicle_images (id,"vehicleId","storageKey",url,"sizeBytes","contentType",position,"isPrimary",status,"altText","updatedAt")
              SELECT i.id,i."vehicleId",i."storageKey",i.url,i."sizeBytes",i."contentType",i.position,i."isPrimary",'READY'::"ImageStatus",i."altText",NOW()
              FROM jsonb_to_recordset(${json}::jsonb) AS i(id uuid,"vehicleId" text,"storageKey" text,url text,"sizeBytes" int,"contentType" text,position int,"isPrimary" boolean,"altText" text)
              ON CONFLICT ("storageKey") DO UPDATE SET url=EXCLUDED.url,"sizeBytes"=EXCLUDED."sizeBytes",position=EXCLUDED.position,"isPrimary"=EXCLUDED."isPrimary","altText"=EXCLUDED."altText","updatedAt"=NOW()`;
          }
          // Replace gallery rows from this same upstream feed, preserving user uploads.
          await tx.vehicleImage.deleteMany({where:{vehicleId:id,OR:[{storageKey:{startsWith:`fbook/${key}-`}},{storageKey:{startsWith:`dealertrade/${key}/`},position:{gte:images.length}}]}});
        });
        imported++;if(!previous)created++;photos+=images.length;
        if(!year)missing.year++;if(!colour)missing.colour++;if(fuelType==='OTHER')missing.fuel++;if(transmission==='UNKNOWN')missing.transmission++;
        if(imported%1000===0)console.log(`${imported}/${stock.length} imported; ${photos} gallery photos`);
      }catch(e){failures.push({vehicleId:key,error:String(e)});if(failures.length===1)console.error(e);}
    }
  }));
  const report={source:'https://dealertrade.co.za',at:new Date().toISOString(),strictSource,rawDealers:dealers.length,rawVehicles:stock.length,imported,created,updated:imported-created,photos,missing,issues,failures};
  writeFileSync(resolve(dir,'import-report.json'),JSON.stringify(report,null,2));
  console.log({...report,issues:issues.length,failures:failures.length});
  if(failures.length)throw Error('Import failures; see import-report.json');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>db.$disconnect());
