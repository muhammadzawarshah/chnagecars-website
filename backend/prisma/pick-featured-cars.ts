/**
 * Runs after every full DealerTrade sync: replaces the featured cars with FEATURED_COUNT random public cars that have
 * a photo, a year and a price, leaving out cars whose main photo is an "images coming soon" picture.
 * `--dry-run` only prints the picks.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { createHash, randomInt } from 'node:crypto';
import { COMING_SOON_VEHICLE_IDS, isComingSoonImage } from '../src/infrastructure/dealertrade/dealertrade-prune';

const FEATURED_COUNT = 12;
const dryRun = process.argv.includes('--dry-run');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

/** True for a coming-soon picture, false for any other photo, null when the photo cannot be downloaded to check. */
async function comingSoon(url: string): Promise<boolean | null> {
  if (!url.startsWith('https://')) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return null;
    return isComingSoonImage(createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'));
  } catch {
    return null;
  }
}

async function main() {
  const candidates = await db.vehicle.findMany({
    where: {
      status: 'PUBLISHED', dealer: { status: 'APPROVED' }, primaryImageUrl: { not: null }, year: { gte: 1900 }, price: { gt: 0 },
      // A DealerTrade car's id is its DealerTrade vehicle_id.
      id: { notIn: COMING_SOON_VEHICLE_IDS },
    },
    select: { id: true, primaryImageUrl: true },
  });
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const picked: string[] = [];
  let unchecked = 0, skipped = 0;
  for (const car of candidates) {
    if (picked.length === FEATURED_COUNT) break;
    // changecars.co.za may refuse the download; the known coming-soon cars are already left out above.
    const verdict = await comingSoon(car.primaryImageUrl!);
    if (verdict) { skipped++; continue; }
    if (verdict === null) unchecked++;
    picked.push(car.id);
  }
  if (!dryRun && picked.length) {
    await db.$transaction([
      db.vehicle.updateMany({ where: { isFeatured: true, id: { notIn: picked } }, data: { isFeatured: false } }),
      db.vehicle.updateMany({ where: { id: { in: picked } }, data: { isFeatured: true } }),
    ]);
  }
  console.log(JSON.stringify({ dryRun, candidates: candidates.length, featured: picked, comingSoonSkipped: skipped, photosUnchecked: unchecked }));
}

main().finally(() => db.$disconnect()).catch((error) => { console.error(error.message); process.exit(1); });
