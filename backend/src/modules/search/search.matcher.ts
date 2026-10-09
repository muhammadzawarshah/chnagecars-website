import { splitCsv } from '../../common/utils/strings';
import { SearchCriteriaDto } from './dto/search.dto';
import { COLLECTION_RULES, enumValues, haversineKm, makeModelGroups, seatFilter } from './search.builder';

/** Everything the matcher needs to know about one vehicle. */
export interface VehicleSnapshot {
  status: string;
  title: string;
  makeSlug: string;
  modelSlug: string;
  variantSlug: string | null;
  condition: string;
  fuelType: string;
  transmission: string;
  drivetrain: string | null;
  province: string;
  city: string;
  colour: string | null;
  dealerSlug: string;
  branchId: string | null;
  categorySlugs: string[];
  price: number;
  year: number | null;
  mileage: number | null;
  engineCapacityCc: number | null;
  powerKw: number | null;
  seats: number | null;
  isSpecial: boolean;
  isFeatured: boolean;
  popularityScore: number;
  publishedAt: Date | null;
  latitude: number | null;
  longitude: number | null;
}

const within = (value: number | null, min?: number, max?: number) => {
  if (min === undefined && max === undefined) return true;
  if (value === null) return false;
  const lo = min !== undefined && max !== undefined ? Math.min(min, max) : min;
  const hi = min !== undefined && max !== undefined ? Math.max(min, max) : max;
  return (lo === undefined || value >= lo) && (hi === undefined || value <= hi);
};

/**
 * In-memory equivalent of buildWhere() used for saved-search alerts (FR-39), so a new
 * listing can be checked against thousands of saved searches without a query per search.
 * Kept behaviourally identical to buildWhere (covered by unit tests).
 */
export function matchesCriteria(vehicle: VehicleSnapshot, criteria: SearchCriteriaDto, now = new Date()): boolean {
  const visible = criteria.availableOnly ? vehicle.status === 'PUBLISHED' : vehicle.status === 'PUBLISHED' || vehicle.status === 'RESERVED';
  if (!visible) return false;

  if (criteria.q) {
    const title = vehicle.title.toLowerCase();
    if (!criteria.q.trim().split(/\s+/).slice(0, 6).every((word) => title.includes(word.toLowerCase()))) return false;
  }

  const { makes, scoped, plain } = makeModelGroups(criteria.make, criteria.model);
  if (makes.length) {
    if (!makes.includes(vehicle.makeSlug)) return false;
    const models = scoped.get(vehicle.makeSlug) ?? plain;
    if (models.length && !models.includes(vehicle.modelSlug)) return false;
  } else if (plain.length && !plain.includes(vehicle.modelSlug)) return false;

  const variants = splitCsv(criteria.variant).map((value) => value.toLowerCase());
  if (variants.length && (!vehicle.variantSlug || !variants.includes(vehicle.variantSlug))) return false;

  const inEnum = (values: string[], actual: string | null) => !values.length || (actual !== null && values.includes(actual));
  if (!inEnum(enumValues('condition', criteria.condition), vehicle.condition)) return false;
  if (!inEnum(enumValues('fuelType', criteria.fuelType), vehicle.fuelType)) return false;
  if (!inEnum(enumValues('transmission', criteria.transmission), vehicle.transmission)) return false;
  if (!inEnum(enumValues('drivetrain', criteria.drivetrain), vehicle.drivetrain)) return false;
  if (!inEnum(enumValues('province', criteria.province), vehicle.province)) return false;

  const categories = splitCsv(criteria.category).map((value) => value.toLowerCase());
  if (categories.length && !categories.some((slug) => vehicle.categorySlugs.includes(slug))) return false;

  if (criteria.city && criteria.city.toLowerCase() !== vehicle.city.toLowerCase()) return false;
  const colours = splitCsv(criteria.colour).map((value) => value.toLowerCase());
  if (colours.length && (!vehicle.colour || !colours.includes(vehicle.colour.toLowerCase()))) return false;
  if (criteria.dealer && criteria.dealer.toLowerCase() !== vehicle.dealerSlug) return false;
  if (criteria.branchId && criteria.branchId !== vehicle.branchId) return false;

  if (!within(vehicle.price, criteria.minPrice, criteria.maxPrice)) return false;
  if (!within(vehicle.year, criteria.minYear, criteria.maxYear)) return false;
  if (!within(vehicle.mileage, criteria.minMileage, criteria.maxMileage)) return false;
  if (!within(vehicle.engineCapacityCc, criteria.minEngineCc, criteria.maxEngineCc)) return false;
  if (!within(vehicle.powerKw, criteria.minPowerKw, criteria.maxPowerKw)) return false;

  const seats = seatFilter(criteria.seats);
  if (seats.exact.length || seats.atLeast !== undefined) {
    const ok = vehicle.seats !== null && (seats.exact.includes(vehicle.seats) || (seats.atLeast !== undefined && vehicle.seats >= seats.atLeast));
    if (!ok) return false;
  }

  if (criteria.onSpecial && !vehicle.isSpecial) return false;
  if (criteria.featured && !vehicle.isFeatured) return false;

  if (criteria.lat !== undefined && criteria.lng !== undefined && criteria.radiusKm) {
    if (vehicle.latitude === null || vehicle.longitude === null) return false;
    if (haversineKm(criteria.lat, criteria.lng, vehicle.latitude, vehicle.longitude) > criteria.radiusKm) return false;
  }

  switch (criteria.collection) {
    case 'specials':
      return vehicle.isSpecial;
    case 'featured':
      return vehicle.isFeatured;
    case 'new-arrivals':
      return !!vehicle.publishedAt && vehicle.publishedAt.getTime() >= now.getTime() - COLLECTION_RULES.newArrivalDays * 86_400_000;
    case 'budget':
      return vehicle.price <= COLLECTION_RULES.budgetMaxPrice;
    case 'student':
      return vehicle.price <= COLLECTION_RULES.studentMaxPrice;
    case 'bakkies':
      return vehicle.categorySlugs.some((slug) => (COLLECTION_RULES.bakkieCategories as readonly string[]).includes(slug));
    case 'electric':
      return vehicle.fuelType === 'ELECTRIC';
    case 'hot-sellers':
      return vehicle.popularityScore > 0;
  }
  return true;
}
