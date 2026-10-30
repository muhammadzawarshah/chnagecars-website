/**
 * Runs after a verified full DealerTrade sync: deletes DealerTrade cars that DealerTrade explicitly marks disabled or removed,
 * and DealerTrade cars without a single photo. Cars listed by dealers on ChangeCars itself are never touched.
 * `--dry-run` only writes the report.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { availableVehicleIds, removedVehicleIds } from '../src/infrastructure/dealertrade/dealertrade-prune';

const dir = resolve(process.env.DEALERTRADE_RECONCILE_DIR || resolve(__dirname, '../.local/dealertrade-reconcile'));
const read = (name: string) => JSON.parse(readFileSync(resolve(dir, 'source', name), 'utf8'));
const dryRun = process.argv.includes('--dry-run');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const rows = read('vehicles.json');
  const available = availableVehicleIds(rows, read('fetch-report.json'));
  // Traversal is non-atomic: absence never proves removal, even with 98% coverage.
  const removed = removedVehicleIds(rows);
  const vehicles = await db.$queryRaw<{ id: string; vehicleId: string; hasImages: boolean }[]>`
    SELECT v.id, v."sourceData"->>'vehicle_id' AS "vehicleId",
           EXISTS (SELECT 1 FROM vehicle_images i WHERE i."vehicleId" = v.id) AS "hasImages"
    FROM vehicles v WHERE v."sourceData"->>'vehicle_id' IS NOT NULL`;
  const gone = vehicles.filter((v) => removed.has(v.vehicleId)).map((v) => v.id);
  // The sync only creates cars once DealerTrade sends photos, so a deleted car comes back with its photos.
  const imageless = vehicles.filter((v) => available.has(v.vehicleId) && !v.hasImages).map((v) => v.id);
  const ids = [...gone, ...imageless];
  let deleted = 0;
  if (!dryRun) {
    // Images, categories, history and favourites cascade; enquiries and leads keep their record without the car.
    for (let i = 0; i < ids.length; i += 1000) deleted += (await db.vehicle.deleteMany({ where: { id: { in: ids.slice(i, i + 1000) } } })).count;
  }
  const report = { dryRun, available: available.size, dealerTradeVehicles: vehicles.length, notAvailable: gone.length, imageless: imageless.length, deleted };
  writeFileSync(resolve(dir, 'prune-report.json'), JSON.stringify({ ...report, notAvailableIds: gone, imagelessIds: imageless }, null, 2));
  console.log(JSON.stringify(report));
}

main().finally(() => db.$disconnect()).catch((error) => { console.error(error.message); process.exit(1); });
