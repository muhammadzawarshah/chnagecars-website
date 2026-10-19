/** Local-only category backfill; preserves original source payloads, IDs and every non-category vehicle field. */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../src/generated/prisma/client';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import definitions from '../src/modules/web/body-types.json';
import { BODY_TYPE_CATEGORY_SLUGS, resolveBodyType } from '../src/modules/vehicles/body-type-mapping';
const url = new URL(process.env.DATABASE_URL!);
if (url.hostname !== '127.0.0.1' || url.port !== '55432' || url.pathname !== '/changecars') throw Error('Local database only');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
(async () => {
  const vehicles = await db.$queryRaw<{ id: string; feed: Record<string, unknown> }[]>`SELECT id,"sourceData"->'dealertrade' feed FROM vehicles WHERE "sourceData"->'dealertrade' IS NOT NULL`;
  const counts: Record<string, number> = {};
  const assignments = vehicles.map(row => {
    const type = resolveBodyType(row.feed);
    counts[type?.label ?? 'Unmapped'] = (counts[type?.label ?? 'Unmapped'] ?? 0) + 1;
    return { vehicleId: row.id, slug: type?.slugs[0] ?? null };
  });
  console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'plan', vehicles: vehicles.length, counts }));
  if (!process.argv.includes('--apply')) return;
  const directory = resolve(__dirname, '../.local/body-type-mapping', new Date().toISOString().replace(/[:.]/g, '-'));
  mkdirSync(directory, { recursive: true });
  await db.$transaction(async tx => {
    await tx.$executeRaw`LOCK TABLE vehicles, categories, "_CategoryToVehicle" IN SHARE ROW EXCLUSIVE MODE`;
    const before = await tx.$queryRaw`SELECT * FROM "_CategoryToVehicle"`;
    const categories = await tx.category.findMany();
    writeFileSync(resolve(directory, 'before.json'), JSON.stringify({ categories, assignments: before }, null, 2));
    await tx.$executeRaw`CREATE TEMP TABLE body_mapping_vehicle_before ON COMMIT DROP AS SELECT id,md5(to_jsonb(v)::text) fingerprint FROM vehicles v`;
    for (const type of definitions) await tx.category.upsert({ where: { slug: type.slugs[0] }, create: { slug: type.slugs[0], name: type.label }, update: { name: type.label } });
    const data = JSON.stringify(assignments);
    await tx.$executeRaw(Prisma.sql`DELETE FROM "_CategoryToVehicle" links USING categories c WHERE links."A"=c.id AND c.slug IN (${Prisma.join(BODY_TYPE_CATEGORY_SLUGS)}) AND links."B" IN (SELECT r."vehicleId" FROM jsonb_to_recordset(${data}::jsonb) AS r("vehicleId" text,slug text))`);
    await tx.$executeRaw`INSERT INTO "_CategoryToVehicle" ("A","B") SELECT c.id,r."vehicleId" FROM jsonb_to_recordset(${data}::jsonb) AS r("vehicleId" text,slug text) JOIN categories c ON c.slug=r.slug ON CONFLICT DO NOTHING`;
    const changed = await tx.$queryRaw<{ count: bigint }[]>`SELECT count(*) count FROM body_mapping_vehicle_before b LEFT JOIN vehicles v ON v.id=b.id WHERE v.id IS NULL OR md5(to_jsonb(v)::text)<>b.fingerprint`;
    if (Number(changed[0].count)) throw Error('Vehicle scalar/source data changed; rolling back');
  }, { timeout: 120000 });
  writeFileSync(resolve(directory, 'report.json'), JSON.stringify({ counts, vehicles: vehicles.length, changedVehicleRows: 0 }, null, 2));
  console.log(JSON.stringify({ result: 'PASS', backup: directory, changedVehicleRows: 0 }));
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
