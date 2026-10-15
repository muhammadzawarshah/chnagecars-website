import 'dotenv/config';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../src/generated/prisma/client';
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!})});
const dir=resolve(__dirname,'../.local/dealertrade');
async function main(){
  const dealers=JSON.parse(readFileSync(resolve(dir,'dealers-all.json'),'utf8'));
  const stock=JSON.parse(readFileSync(resolve(dir,'stock-all.json'),'utf8'));
  const snapshots=await db.$queryRaw<{kind:string;externalId:string;payload:Record<string,any>}[]>`SELECT kind,"externalId",payload FROM source_feed_records WHERE source='dealertrade'`;
  const rawMap=new Map(snapshots.map(r=>[r.kind+':'+r.externalId,r.payload]));
  for(const r of dealers)assert.deepEqual(rawMap.get('dealer:'+r.dealer_id),r);
  for(const r of stock)assert.deepEqual(rawMap.get('vehicle:'+r.vehicle_id),r);
  const vehicles=await db.vehicle.findMany({where:{sourceData:{path:['dealertrade'],not:Prisma.AnyNull}},include:{images:{where:{storageKey:{startsWith:'dealertrade/'}}}}});
  const byId=new Map(vehicles.map(v=>[String((v.sourceData as any).vehicle_id),v]));
  const variants=new Map((await db.variant.findMany({where:{slug:{contains:'-dealertrade-'}},include:{specification:true}})).map(v=>[v.id,v]));
  assert.equal(byId.size,vehicles.length,'Duplicate API vehicle identities');
  const importReport=JSON.parse(readFileSync(resolve(dir,'import-report.json'),'utf8'));
  const excluded=new Set(importReport.issues.filter((i:any)=>i.vehicleId).map((i:any)=>i.vehicleId));
  assert.equal(importReport.failures.length,0,'Unresolved import failures');
  let local=0,remote=0,photos=0,missingYear=0,missingColour=0,unknownFuel=0;
  for(const r of stock){
    if(excluded.has(String(r.vehicle_id)))continue;
    const v=byId.get(String(r.vehicle_id));assert.ok(v,`Missing vehicle ${r.vehicle_id}`);
    assert.deepEqual((v.sourceData as any).dealertrade,r,'API source changed');
    assert.equal(v.price,Number(r.price));
    assert.equal(v.transmission,r.transmission_type_id===1?'MANUAL':'AUTOMATIC');
    assert.equal(v.condition,({New:'NEW',Used:'USED',Demo:'DEMO'} as any)[r.type]);
    if(r.mileage!==null&&r.mileage!==''&&Number.isSafeInteger(Number(r.mileage))&&Number(r.mileage)>=0)assert.equal(v.mileage,Number(r.mileage));
    if(v.variantId&&variants.has(v.variantId)){
      const variant=variants.get(v.variantId)!;assert.equal(variant.modelId,v.modelId);assert.equal(variant.name,r.variant_name);assert.equal(variant.yearFrom,Number(r.introduction_date.slice(0,4)));
      const spec=variant.specification!;
      for(const [source,target] of Object.entries({engine_capacity:'engineCapacityCc',cylinders:'cylinders',kilowatts:'powerKw',no_gears:'gears',no_seats:'seats',no_doors:'doors',fuel_tank_size:'fuelTankLitres'})){
        const value=(spec as any)[target];if(value!==null)assert.equal(value,Number(r[source]),`Variant ${variant.id}: ${target}`);
      }
    }
    const expected=r.photos??[];
    assert.equal(v.imageCount,expected.length);assert.equal(v.images.length,expected.length);
    const positions=new Set(v.images.map(i=>i.position));assert.equal(positions.size,expected.length);
    for(const image of v.images){
      assert.equal(image.isPrimary,image.position===0);
      const p=expected[image.position];const source=p.startsWith('https://')?p:r.cdn_url.replace(/\/$/,'')+'/'+p.replace(/^\//,'');
      if(image.url?.startsWith('/media/dealertrade/')){
        const extension=new URL(source).pathname.match(/\.(jpg|jpeg|png|webp)$/i)?.[0].toLowerCase()??'.jpg';
        assert.equal(image.url,'/media/dealertrade/'+createHash('sha256').update(source).digest('hex')+extension);
        const file=resolve(__dirname,'../../public',image.url.slice(1));assert.ok(existsSync(file));assert.equal(statSync(file).size,image.sizeBytes);local++;
      }else{assert.equal(image.url,source);remote++;}
      photos++;
    }
    if(!v.year)missingYear++;if(!v.colour)missingColour++;if(v.fuelType==='OTHER')unknownFuel++;
    if(expected.length)assert.equal(v.primaryImageUrl,v.images.find(i=>i.position===0)?.url);
  }
  assert.equal(vehicles.length+excluded.size,stock.length);
  const report={at:new Date().toISOString(),rawDealersVerified:dealers.length,rawVehiclesVerified:stock.length,normalizedVehiclesVerified:vehicles.length,rawOnlyVehicles:excluded.size,variantsVerified:variants.size,photosVerified:photos,localPhotos:local,remotePhotos:remote,missingYear,missingColour,unknownFuel};
  writeFileSync(resolve(dir,'verification-report.json'),JSON.stringify(report,null,2));console.log(report);
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.$disconnect());
