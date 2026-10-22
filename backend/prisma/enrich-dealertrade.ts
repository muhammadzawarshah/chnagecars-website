import { resolveBodyType } from '../src/modules/vehicles/body-type-mapping';
import bodyTypes from '../src/modules/web/body-types.json';
/** Normalize verified API variants/specifications and exact source URL body categories. */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../src/generated/prisma/client';
import { Drivetrain } from '../src/common/utils/drivetrain';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { slugify } from '../src/modules/web/web-format';
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!,max:10})});
const dir=resolve(__dirname,'../.local/dealertrade');
const uuid=(key:string)=>{const h=createHash('sha256').update('changecars-dealertrade:'+key).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
const positive=(v:any)=>v!==null&&v!==''&&Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):undefined;
async function main(){
  const stock:Record<string,any>[]=JSON.parse(readFileSync(resolve(dir,'stock-all.json'),'utf8'));
  const vehicles=await db.vehicle.findMany({where:{sourceData:{path:['dealertrade'],not:Prisma.AnyNull}},select:{id:true,modelId:true,sourceData:true}});
  const byExternal=new Map(vehicles.map(v=>[String((v.sourceData as any).vehicle_id),v]));
  const groups=new Map<string,Record<string,any>[]>();
  for(const r of stock){const key=String(r.model_variant_id);if(!positive(r.model_variant_id)||!r.variant_name)continue;const group=groups.get(key)??[];group.push(r);groups.set(key,group);}
  const issues:Record<string,any>[]=[];
  let variants=0,linkedVehicles=0,cursor=0;
  const jobs=[...groups];
  await Promise.all(Array.from({length:8},async()=>{while(cursor<jobs.length){
    const [externalId,rows]=jobs[cursor++],r=rows[0];
    const modelIds=new Set(rows.map(s=>byExternal.get(String(s.vehicle_id))?.modelId).filter(Boolean));
    const dates=[...new Set(rows.map(s=>s.introduction_date))];
    const date=dates[0],parsed=typeof date==='string'?new Date(date+'T00:00:00Z'):null;
    const match=dates.length===1&&typeof date==='string'&&/^(19|20)\d{2}-\d{2}-\d{2}$/.test(date)&&parsed&&!Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===date?date:null;
    if(modelIds.size!==1||!match){issues.push({variantId:externalId,reason:modelIds.size!==1?'Conflicting/missing model identity':'No single valid introduction date; variant retained in raw API records'});continue;}
    const id=uuid('variant:'+externalId),modelId=[...modelIds][0]!;
    const data={modelId,name:r.variant_name,slug:`${slugify(r.variant_name)}-dealertrade-${externalId}`,yearFrom:Number(match.slice(0,4))};
    await db.variant.upsert({where:{id},create:{id,...data},update:data});
    const spec:Record<string,any>={engineCapacityCc:null,cylinders:null,powerKw:null,gears:null,seats:null,doors:null,fuelTankLitres:null,transmission:null,drivetrain:null};
    const fields:Record<string,string>={engine_capacity:'engineCapacityCc',cylinders:'cylinders',kilowatts:'powerKw',no_gears:'gears',no_seats:'seats',no_doors:'doors',fuel_tank_size:'fuelTankLitres'};
    for(const [from,to] of Object.entries(fields)){
      const values=[...new Set(rows.map(s=>s[from]).filter(v=>v!==null&&v!==''))];
      if(values.length===1&&positive(values[0]))spec[to]=Number(values[0]);
      else if(values.length>1)issues.push({variantId:externalId,field:from,reason:'Conflicting listing specifications; per-vehicle source retained'});
    }
    const transmissions=[...new Set(rows.map(s=>s.transmission_type_id))];
    if(transmissions.length===1)spec.transmission=({1:'MANUAL',2:'AUTOMATIC'} as any)[transmissions[0]];
    const drives=[...new Set(rows.map(s=>s.driven_wheels))];
    if(drives.length===1)spec.drivetrain=({'4X2':'4x2','4X4':'4x4','FWD':'FWD','RWD':'RWD','AWD':'AWD'} as Record<string,Drivetrain>)[drives[0]];
    const extra={source:'dealertrade',model_variant_id:r.model_variant_id,introduction_date:match,mmcode:r.mmcode,front_tyre_size:r.front_tyre_size,rear_tyre_size:r.rear_tyre_size,sourceVehicleIds:rows.map(s=>s.vehicle_id)};
    await db.variantSpecification.upsert({where:{variantId:id},create:{variantId:id,...spec,extra:extra as Prisma.InputJsonValue},update:{...spec,extra:extra as Prisma.InputJsonValue}});
    const ids=rows.map(s=>byExternal.get(String(s.vehicle_id))?.id).filter((v):v is string=>!!v);
    const result=await db.vehicle.updateMany({where:{id:{in:ids}},data:{variantId:id}});linkedVehicles+=result.count;variants++;
  }}));
  const bodies:Record<string,string>={'suv':'suvs','sedan':'sedans','hatchback':'hatchbacks','coupe':'coupes','convertible':'convertibles','mpv':'mpvs','panel-van':'panel-vans','double-cab-bakkie':'double-cabs','single-cab-bakkie':'single-cabs','extended-cab':'king-cabs','minibus':'minibuses','motorbike':'motorbikes','station-wagon':'station-wagons'};
  const cats=new Map<string,string>();
  for(const type of bodyTypes){const slug=type.slugs[0];const c=await db.category.upsert({where:{slug},create:{name:type.label,slug},update:{name:type.label}});cats.set(slug,c.id);}
  const assignments=stock.flatMap(r=>{const v=byExternal.get(String(r.vehicle_id)),categoryId=cats.get(resolveBodyType((v?.sourceData as any)?.dealertrade??r)?.slugs[0]??'');return v&&categoryId?[{vehicleId:v.id,categoryId}]:[];});
  for(let i=0;i<assignments.length;i+=500){
    const data=JSON.stringify(assignments.slice(i,i+500));
    await db.$executeRaw`INSERT INTO "_CategoryToVehicle" ("A","B") SELECT m."categoryId",m."vehicleId" FROM jsonb_to_recordset(${data}::jsonb) AS m("vehicleId" text,"categoryId" uuid) ON CONFLICT DO NOTHING`;
  }
  const report={variants,linkedVehicles,bodyAssignments:assignments.length,issues};writeFileSync(resolve(dir,'enrichment-report.json'),JSON.stringify(report,null,2));console.log({...report,issues:issues.length});
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.$disconnect());
