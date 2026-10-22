import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../src/generated/prisma/client';
import { createHash } from 'node:crypto';
import { existsSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!})});
async function main(){
  const vehicles=await db.vehicle.findMany({where:{sourceData:{path:['dealertrade'],not:Prisma.AnyNull}},select:{id:true,images:{where:{storageKey:{startsWith:'dealertrade/'}},select:{id:true,url:true,position:true}}}});
  const ready:{id:string;vehicleId:string;url:string;size:number;position:number}[]=[];
  let remote=0,local=0;
  for(const v of vehicles)for(const i of v.images){
    if(!i.url)continue;
    if(i.url.startsWith('/media/dealertrade/')){const p=resolve(__dirname,'../../frontend/public',i.url.slice(1));if(!existsSync(p)||statSync(p).size<16)throw Error(`Missing local file ${i.id}`);local++;continue;}
    if(!i.url.startsWith('https://www.changecars.co.za/'))throw Error(`Unexpected image source ${i.id}`);
    const extension=new URL(i.url).pathname.match(/\.(jpg|jpeg|png|webp)$/i)?.[0].toLowerCase()??'.jpg';
    const url='/media/dealertrade/'+createHash('sha256').update(i.url).digest('hex')+extension;
    const p=resolve(__dirname,'../../frontend/public',url.slice(1));
    if(existsSync(p)&&statSync(p).size>16)ready.push({id:i.id,vehicleId:v.id,url,size:statSync(p).size,position:i.position});else remote++;
  }
  for(let start=0;start<ready.length;start+=500){
    const data=JSON.stringify(ready.slice(start,start+500));
    await db.$transaction([
      db.$executeRaw`UPDATE vehicle_images i SET url=m.url,"sizeBytes"=m.size,"updatedAt"=NOW() FROM jsonb_to_recordset(${data}::jsonb) AS m(id uuid,url text,size int) WHERE i.id=m.id`,
      db.$executeRaw`UPDATE vehicles v SET "primaryImageUrl"=m.url,"updatedAt"=NOW() FROM jsonb_to_recordset(${data}::jsonb) AS m("vehicleId" text,url text,position int) WHERE v.id=m."vehicleId" AND m.position=0`,
    ]);
  }
  const report={vehicles:vehicles.length,newlyLocal:ready.length,alreadyLocal:local,remoteImages:remote};
  writeFileSync(resolve(__dirname,'../.local/dealertrade/media-sync-report.json'),JSON.stringify(report,null,2));console.log(report);
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.$disconnect());
