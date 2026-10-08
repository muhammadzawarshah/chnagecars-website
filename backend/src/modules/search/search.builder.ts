import { Prisma, VehicleStatus } from '../../generated/prisma/client';
import { splitCsv } from '../../common/utils/strings';
import { Collection, SearchCriteriaDto, SortKey } from './dto/search.dto';

const ENUMS = {
  condition: ['NEW', 'USED', 'DEMO'],
  fuelType: ['PETROL', 'DIESEL', 'HYBRID', 'PLUGIN_HYBRID', 'ELECTRIC', 'LPG', 'OTHER'],
  transmission: ['UNKNOWN', 'MANUAL', 'AUTOMATIC'],
  drivetrain: ['FWD', 'RWD', 'AWD', 'FOUR_X_TWO', 'FOUR_X_FOUR'],
  province: ['EASTERN_CAPE', 'FREE_STATE', 'GAUTENG', 'KWAZULU_NATAL', 'LIMPOPO', 'MPUMALANGA', 'NORTHERN_CAPE', 'NORTH_WEST', 'WESTERN_CAPE'],
} as const;

/** Upper-cases and keeps only known enum values, so bad input narrows nothing instead of erroring. */
export function enumValues<K extends keyof typeof ENUMS>(kind: K, raw?: string): (typeof ENUMS)[K][number][] {
  const allowed = ENUMS[kind] as readonly string[];
  return splitCsv(raw)
    .map((value) => value.toUpperCase().replace(/[\s-]+/g, '_'))
    .filter((value) => allowed.includes(value)) as (typeof ENUMS)[K][number][];
}

export const COLLECTION_RULES = {
  budgetMaxPrice: 150_000,
  studentMaxPrice: 200_000,
  newArrivalDays: 7,
  bakkieCategories: ['bakkies', 'super-cabs', 'king-cabs', 'double-cabs'],
} as const;

/** Parses "8+" style seat filters into a predicate shape. */
export function seatFilter(raw?: string): { exact: number[]; atLeast?: number } {
  const exact: number[] = [];
  let atLeast: number | undefined;
  for (const item of splitCsv(raw)) {
    if (item.endsWith('+')) {
      const value = Number(item.slice(0, -1));
      if (Number.isInteger(value)) atLeast = atLeast === undefined ? value : Math.min(atLeast, value);
    } else if (Number.isInteger(Number(item))) exact.push(Number(item));
  }
  return { exact, atLeast };
}

/**
 * Make/model scoping: "make=bmw,toyota&model=toyota:corolla" means any BMW, or a Toyota Corolla.
 * Plain models ("model=corolla") apply to every selected make.
 */
export function makeModelGroups(makeRaw?: string, modelRaw?: string) {
  const makes = splitCsv(makeRaw).map((value) => value.toLowerCase());
  const scoped = new Map<string, string[]>();
  const plain: string[] = [];
  for (const entry of splitCsv(modelRaw).map((value) => value.toLowerCase())) {
    const [make, model] = entry.includes(':') ? entry.split(':', 2) : [undefined, entry];
    if (make && model) scoped.set(make, [...(scoped.get(make) ?? []), model]);
    else if (model) plain.push(model);
  }
  for (const make of scoped.keys()) if (!makes.includes(make)) makes.push(make);
  return { makes, scoped, plain };
}

/** Approximate bounding box for a radius search (exact distance is checked by the matcher). */
export function boundingBox(lat: number, lng: number, radiusKm: number) {
  const dLat = radiusKm / 111.32;
  const dLng = radiusKm / (111.32 * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));
  return { minLat: lat - dLat, maxLat: lat + dLat, minLng: lng - dLng, maxLng: lng + dLng };
}

/** Criteria → Prisma `where`. Public visibility rules (BR-01, BR-04, BR-05) are always applied. */
export function buildWhere(criteria: SearchCriteriaDto, now = new Date()): Prisma.VehicleWhereInput {
  const and: Prisma.VehicleWhereInput[] = [];

  and.push({ status: criteria.availableOnly ? VehicleStatus.PUBLISHED : { in: [VehicleStatus.PUBLISHED, VehicleStatus.RESERVED] } });
  and.push({ dealer: { status: 'APPROVED' } });

  if (criteria.q) {
    for (const word of criteria.q.trim().split(/\s+/).slice(0, 6)) {
      and.push({ title: { contains: word, mode: 'insensitive' } });
    }
  }

  const { makes, scoped, plain } = makeModelGroups(criteria.make, criteria.model);
  if (makes.length) {
    and.push({
      OR: makes.map((make) => {
        const models = scoped.get(make) ?? plain;
        return { make: { slug: make }, ...(models.length ? { model: { slug: { in: models } } } : {}) };
      }),
    });
  } else if (plain.length) {
    and.push({ model: { slug: { in: plain } } });
  }

  const variants = splitCsv(criteria.variant).map((value) => value.toLowerCase());
  if (variants.length) and.push({ variant: { slug: { in: variants } } });

  const conditions = enumValues('condition', criteria.condition);
  if (conditions.length) and.push({ condition: { in: conditions } });
  const fuels = enumValues('fuelType', criteria.fuelType);
  if (fuels.length) and.push({ fuelType: { in: fuels } });
  const transmissions = enumValues('transmission', criteria.transmission);
  if (transmissions.length) and.push({ transmission: { in: transmissions } });
  const drivetrains = enumValues('drivetrain', criteria.drivetrain);
  if (drivetrains.length) and.push({ drivetrain: { in: drivetrains } });
  const provinces = enumValues('province', criteria.province);
  if (provinces.length) and.push({ province: { in: provinces } });

  const categories = splitCsv(criteria.category).map((value) => value.toLowerCase());
  if (categories.length) and.push({ categories: { some: { slug: { in: categories } } } });

  if (criteria.city) and.push({ city: { equals: criteria.city, mode: 'insensitive' } });
  const colours = splitCsv(criteria.colour);
  if (colours.length) and.push({ OR: colours.map((colour) => ({ colour: { equals: colour, mode: 'insensitive' as const } })) });
  if (criteria.dealer) and.push({ dealer: { slug: criteria.dealer.toLowerCase() } });
  if (criteria.branchId) and.push({ branchId: criteria.branchId });

  const range = (field: 'price' | 'year' | 'mileage' | 'engineCapacityCc' | 'powerKw', min?: number, max?: number) => {
    if (min === undefined && max === undefined) return;
    const lo = min !== undefined && max !== undefined ? Math.min(min, max) : min;
    const hi = min !== undefined && max !== undefined ? Math.max(min, max) : max;
    and.push({ [field]: { ...(lo !== undefined ? { gte: lo } : {}), ...(hi !== undefined ? { lte: hi } : {}) } });
  };
  range('price', criteria.minPrice, criteria.maxPrice);
  range('year', criteria.minYear, criteria.maxYear);
  range('mileage', criteria.minMileage, criteria.maxMileage);
  range('engineCapacityCc', criteria.minEngineCc, criteria.maxEngineCc);
  range('powerKw', criteria.minPowerKw, criteria.maxPowerKw);

  const seats = seatFilter(criteria.seats);
  if (seats.exact.length || seats.atLeast !== undefined) {
    and.push({
      OR: [
        ...(seats.exact.length ? [{ seats: { in: seats.exact } }] : []),
        ...(seats.atLeast !== undefined ? [{ seats: { gte: seats.atLeast } }] : []),
      ],
    });
  }

  if (criteria.onSpecial) and.push({ isSpecial: true });
  if (criteria.featured) and.push({ isFeatured: true });

  if (criteria.lat !== undefined && criteria.lng !== undefined && criteria.radiusKm) {
    const box = boundingBox(criteria.lat, criteria.lng, criteria.radiusKm);
    and.push({ latitude: { gte: box.minLat, lte: box.maxLat }, longitude: { gte: box.minLng, lte: box.maxLng } });
  }

  switch (criteria.collection as Collection | undefined) {
    case 'specials':
      and.push({ isSpecial: true });
      break;
    case 'featured':
      and.push({ isFeatured: true });
      break;
    case 'new-arrivals':
      and.push({ publishedAt: { gte: new Date(now.getTime() - COLLECTION_RULES.newArrivalDays * 86_400_000) } });
      break;
    case 'budget':
      and.push({ price: { lte: COLLECTION_RULES.budgetMaxPrice } });
      break;
    case 'student':
      and.push({ price: { lte: COLLECTION_RULES.studentMaxPrice } });
      break;
    case 'bakkies':
      and.push({ categories: { some: { slug: { in: [...COLLECTION_RULES.bakkieCategories] } } } });
      break;
    case 'electric':
      and.push({ fuelType: 'ELECTRIC' });
      break;
    case 'hot-sellers':
      and.push({ popularityScore: { gt: 0 } });
      break;
  }

  return { AND: and };
}

/** FR-05 sorting. `id` is the final tie-breaker so pages never overlap or skip rows. */
export function buildOrderBy(sort: SortKey | undefined, collection?: Collection): Prisma.VehicleOrderByWithRelationInput[] {
  const key = sort ?? (collection === 'hot-sellers' ? 'popular' : 'recent');
  const primary: Record<SortKey, Prisma.VehicleOrderByWithRelationInput[]> = {
    recent: [{ publishedAt: 'desc' }],
    oldest: [{ publishedAt: 'asc' }],
    'price-asc': [{ price: 'asc' }],
    'price-desc': [{ price: 'desc' }],
    'mileage-asc': [{ mileage: 'asc' }],
    'mileage-desc': [{ mileage: 'desc' }],
    'year-desc': [{ year: 'desc' }, { publishedAt: 'desc' }],
    'year-asc': [{ year: 'asc' }, { publishedAt: 'desc' }],
    popular: [{ popularityScore: 'desc' }],
  };
  return [...primary[key], { id: 'desc' }];
}

/** Stable cache key for a query (key order and empty values do not matter). */
export function criteriaKey(query: object): string {
  return Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value).toLowerCase()}`)
    .join('&');
}
