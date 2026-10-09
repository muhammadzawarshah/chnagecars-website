/**
 * Fills branch and vehicle coordinates for "Near Me" search. Each branch is located from its
 * suburb/city (or, when the city is blank, the place names in its address) through OpenStreetMap
 * Nominatim; vehicles take their branch's point. Results are cached in fixtures/sa-locations.json,
 * so later runs work offline and only look up new places.
 *
 *   npx tsx prisma/sync-locations.ts            # fill missing coordinates
 *   npx tsx prisma/sync-locations.ts --all      # recompute every branch and vehicle
 */
import 'dotenv/config';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Province } from '../src/generated/prisma/client';

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const CACHE_FILE = resolve(__dirname, 'fixtures/sa-locations.json');
const ALL = process.argv.includes('--all');

const PROVINCE_NAMES: Record<Province, string> = {
  EASTERN_CAPE: 'Eastern Cape',
  FREE_STATE: 'Free State',
  GAUTENG: 'Gauteng',
  KWAZULU_NATAL: 'KwaZulu-Natal',
  LIMPOPO: 'Limpopo',
  MPUMALANGA: 'Mpumalanga',
  NORTHERN_CAPE: 'Northern Cape',
  NORTH_WEST: 'North West',
  WESTERN_CAPE: 'Western Cape',
};

/** Rough province centre and radius (km), to reject a same-named suburb in another province. */
const PROVINCE_AREA: Record<Province, [number, number, number]> = {
  EASTERN_CAPE: [-32.5, 26.5, 400],
  FREE_STATE: [-28.5, 26.8, 350],
  GAUTENG: [-26.1, 28.1, 120],
  KWAZULU_NATAL: [-29.0, 30.9, 350],
  LIMPOPO: [-23.8, 29.5, 350],
  MPUMALANGA: [-25.8, 30.3, 250],
  NORTHERN_CAPE: [-29.0, 21.8, 500],
  NORTH_WEST: [-26.2, 25.8, 350],
  WESTERN_CAPE: [-33.5, 20.0, 400],
};

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const inProvince = ([lat, lng]: [number, number], province: Province) => {
  const [centreLat, centreLng, radius] = PROVINCE_AREA[province];
  return distanceKm(lat, lng, centreLat, centreLng) <= radius;
};

type Point = [number, number] | null;
const cache: Record<string, Point> = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, 'utf8')) : {};
const saveCache = () => writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b))), null, 1) + '\n');

let lastCall = 0;
/** One request per second, as the Nominatim usage policy asks. */
async function geocode(query: string): Promise<Point> {
  if (query in cache) return cache[query];
  const wait = lastCall + 1100 - Date.now();
  if (wait > 0) await new Promise((done) => setTimeout(done, wait));
  lastCall = Date.now();
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=za&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { 'user-agent': 'ChangeCars location sync (dev)' } });
  if (!response.ok) throw new Error(`Nominatim ${response.status} for "${query}"`);
  // Only places (suburb, town, city), never a street that shares the name ("Strand Street").
  const hit = ((await response.json()) as { lat: string; lon: string; class: string }[]).find((result) => result.class === 'place' || result.class === 'boundary');
  cache[query] = hit ? [Number(Number(hit.lat).toFixed(5)), Number(Number(hit.lon).toFixed(5))] : null;
  saveCache();
  return cache[query];
}

/** Place names from an address, without street numbers, postcodes, shop units or the country. */
function addressPlaces(address: string): string[] {
  return address
    .replace(/&amp;/g, '&')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && !/\d/.test(part) && !/^(south africa|cnr|c\/o|corner)\b/i.test(part) && !/\b(road|rd|street|st|avenue|ave|drive|dr|boulevard|centre|shop)\b/i.test(part));
}

/**
 * Most specific first: suburb + town from the address (suburb names repeat across the country,
 * so the town disambiguates), then the branch city, then the town alone.
 */
function queries(branch: { address: string | null; city: string; province: Province }): string[] {
  const places = addressPlaces(branch.address ?? '');
  const province = PROVINCE_NAMES[branch.province];
  const list: string[] = [];
  if (places.length >= 2) list.push(`${places.slice(-2).join(', ')}, South Africa`);
  if (branch.city) list.push(`${branch.city}, ${province}, South Africa`, `${branch.city}, South Africa`);
  if (places.length) list.push(`${places[places.length - 1]}, South Africa`, `${places[0]}, South Africa`);
  return [...new Set(list)];
}

async function main() {
  const branches = await db.branch.findMany({
    where: ALL ? {} : { OR: [{ latitude: null }, { longitude: null }] },
    select: { id: true, address: true, city: true, province: true },
  });
  console.log(`Locating ${branches.length} branches`);
  let located = 0;
  const missing: string[] = [];
  for (const branch of branches) {
    // First hit inside the branch's province; otherwise the first hit at all (the province may be wrong).
    let point: Point = null;
    let fallback: Point = null;
    for (const query of queries(branch)) {
      const hit = await geocode(query);
      if (hit && inProvince(hit, branch.province)) {
        point = hit;
        break;
      }
      fallback ??= hit;
    }
    point ??= fallback;
    if (!point) {
      missing.push(`${branch.city || '-'} | ${branch.address ?? '-'}`);
      continue;
    }
    await db.branch.update({ where: { id: branch.id }, data: { latitude: point[0], longitude: point[1] } });
    located++;
  }

  const vehicles = await db.$executeRaw`
    UPDATE vehicles v SET latitude = b.latitude, longitude = b.longitude
    FROM branches b
    WHERE b.id = v."branchId" AND b.latitude IS NOT NULL
      AND (${ALL} OR v.latitude IS NULL OR v.longitude IS NULL)`;

  console.log(`Branches located: ${located}/${branches.length}; vehicles updated: ${vehicles}`);
  if (missing.length) console.log(`Not found:\n  ${missing.join('\n  ')}`);
}

main().finally(() => db.$disconnect());
