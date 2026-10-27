import { buildOrderBy, buildWhere, criteriaKey, cylinderValues, makeModelGroups, seatFilter } from './search.builder';
import { matchesCriteria, VehicleSnapshot } from './search.matcher';

const hilux: VehicleSnapshot = {
  status: 'PUBLISHED',
  title: '2022 Toyota Hilux 2.8 GD-6 Legend',
  makeSlug: 'toyota',
  modelSlug: 'hilux',
  variantSlug: 'legend-2021',
  condition: 'USED',
  fuelType: 'DIESEL',
  transmission: 'AUTOMATIC',
  drivetrain: 'FOUR_X_FOUR',
  province: 'Gauteng',
  city: 'Sandton',
  colour: 'White',
  dealerSlug: 'sandton-auto',
  branchId: null,
  categorySlugs: ['double-cabs'],
  price: 650_000,
  year: 2022,
  mileage: 60_000,
  engineCapacityCc: 2755,
  powerKw: 150,
  seats: 5,
  cylinders: 4,
  isSpecial: false,
  isFeatured: true,
  popularityScore: 10,
  publishedAt: new Date('2026-05-30T00:00:00Z'),
  latitude: -26.1,
  longitude: 28.05,
};
const now = new Date('2026-06-01T00:00:00Z');

describe('search criteria', () => {
  it('scopes models to their make', () => {
    const groups = makeModelGroups('bmw', 'toyota:hilux,corolla');
    expect(groups.makes).toEqual(['bmw', 'toyota']);
    expect(groups.scoped.get('toyota')).toEqual(['hilux']);
    expect(groups.plain).toEqual(['corolla']);
  });

  it('parses seat filters', () => {
    expect(seatFilter('5,7,8+')).toEqual({ exact: [5, 7], atLeast: 8 });
  });

  it('matches like the database query would', () => {
    expect(matchesCriteria(hilux, {}, now)).toBe(true);
    expect(matchesCriteria(hilux, { make: 'bmw,toyota', model: 'toyota:hilux' }, now)).toBe(true);
    expect(matchesCriteria(hilux, { make: 'toyota', model: 'toyota:corolla-cross' }, now)).toBe(false);
    expect(matchesCriteria(hilux, { fuelType: 'diesel', transmission: 'automatic' }, now)).toBe(true);
    expect(matchesCriteria(hilux, { fuelType: 'PETROL' }, now)).toBe(false);
    expect(matchesCriteria(hilux, { maxPrice: 600_000 }, now)).toBe(false);
    expect(matchesCriteria(hilux, { minPrice: 700_000, maxPrice: 600_000 }, now)).toBe(true); // swapped bounds are normalised
    expect(matchesCriteria(hilux, { category: 'double-cabs', province: 'Gauteng' }, now)).toBe(true);
    expect(matchesCriteria(hilux, { q: 'hilux legend' }, now)).toBe(true);
    expect(matchesCriteria(hilux, { q: 'hilux raider' }, now)).toBe(false);
    expect(matchesCriteria(hilux, { seats: '7,8+' }, now)).toBe(false);
    expect(matchesCriteria(hilux, { collection: 'new-arrivals' }, now)).toBe(true);
    expect(matchesCriteria(hilux, { collection: 'bakkies' }, now)).toBe(true);
    expect(matchesCriteria(hilux, { lat: -26.2, lng: 28.04, radiusKm: 20 }, now)).toBe(true);
    expect(matchesCriteria(hilux, { lat: -33.9, lng: 18.4, radiusKm: 50 }, now)).toBe(false);
    expect(matchesCriteria({ ...hilux, status: 'RESERVED' }, { availableOnly: true }, now)).toBe(false);
    expect(matchesCriteria({ ...hilux, status: 'SOLD' }, {}, now)).toBe(false);
  });

  it('keeps listings with unknown year or mileage visible without range filters', () => {
    const unknown = { ...hilux, year: null, mileage: null };
    expect(matchesCriteria(unknown, {}, now)).toBe(true);
    expect(matchesCriteria(unknown, { minYear: 2020 }, now)).toBe(false);
    expect(matchesCriteria(unknown, { maxMileage: 100000 }, now)).toBe(false);
  });

  it('always applies public visibility rules in SQL', () => {
    const where = buildWhere({}) as { AND: unknown[] };
    expect(where.AND).toEqual(
      expect.arrayContaining([{ status: { in: ['PUBLISHED', 'RESERVED'] } }, { dealer: { status: 'APPROVED' } }]),
    );
  });

  it('ignores unknown enum values instead of failing', () => {
    const where = buildWhere({ fuelType: 'banana' }) as { AND: unknown[] };
    expect(JSON.stringify(where)).not.toContain('fuelType');
  });

  it('sorts deterministically with an id tie-breaker', () => {
    expect(buildOrderBy('price-asc')).toEqual([{ price: 'asc' }, { id: 'desc' }]);
    expect(buildOrderBy(undefined, 'hot-sellers')[0]).toEqual({ popularityScore: 'desc' });
  });

  it('filters on any of the listed cylinder counts and leaves out unknown cylinders', () => {
    expect(cylinderValues('3, 4,5,4')).toEqual([3, 4, 5]);
    expect(JSON.stringify(buildWhere({ cylinders: '3,4,5' }))).toContain('"cylinders":{"in":[3,4,5]}');
    expect(matchesCriteria(hilux, { cylinders: '3,4,5' }, now)).toBe(true);
    expect(matchesCriteria(hilux, { cylinders: '6,7,8' }, now)).toBe(false);
    expect(matchesCriteria({ ...hilux, cylinders: null }, { cylinders: '3,4,5' }, now)).toBe(false);
    expect(matchesCriteria({ ...hilux, cylinders: null }, {}, now)).toBe(true);
  });

  it('treats onSpecial=false as "not on special" and omitted as both', () => {
    expect(JSON.stringify(buildWhere({ onSpecial: false }))).toContain('"isSpecial":false');
    expect(JSON.stringify(buildWhere({ onSpecial: true }))).toContain('"isSpecial":true');
    expect(JSON.stringify(buildWhere({}))).not.toContain('isSpecial');
    expect(matchesCriteria(hilux, { onSpecial: false }, now)).toBe(true);
    expect(matchesCriteria({ ...hilux, isSpecial: true }, { onSpecial: false }, now)).toBe(false);
    expect(matchesCriteria({ ...hilux, isSpecial: true }, {}, now)).toBe(true);
  });

  it('matches a vehicle on any of its body types', () => {
    expect(JSON.stringify(buildWhere({ category: 'single-cabs' }))).toContain('"categories":{"some":{"slug":{"in":["single-cabs","bakkies"]}}}');
    expect(matchesCriteria({ ...hilux, categorySlugs: ['single-cabs'] }, { category: 'bakkies' }, now)).toBe(true);
    const both = { ...hilux, categorySlugs: ['bakkies', 'single-cabs'] };
    expect(matchesCriteria(both, { category: 'single-cabs' }, now)).toBe(true);
    expect(matchesCriteria(both, { category: 'bakkies' }, now)).toBe(true);
  });

  it('cache keys ignore parameter order and empty values', () => {
    expect(criteriaKey({ make: 'BMW', q: '', page: 1 })).toBe(criteriaKey({ page: 1, make: 'bmw' }));
  });
});

describe('standard colour ID filtering', () => {
  it('matches white by ID through all aliases and rejects other colours', () => {
    for (const criteria of [{colourId:'15'}, {colour_id:'15'}, {color_id:'15'}]) {
      expect(matchesCriteria(hilux, criteria, now)).toBe(true);
      expect(matchesCriteria({...hilux,colour:'Black'}, criteria, now)).toBe(false);
      expect(JSON.stringify(buildWhere(criteria))).toContain('White');
    }
  });
  it('supports multiple IDs, Any and Unknown consistently', () => {
    expect(matchesCriteria(hilux,{colourId:'3,15'},now)).toBe(true);
    expect(matchesCriteria(hilux,{colourId:'1'},now)).toBe(true);
    expect(matchesCriteria(hilux,{colourId:'14'},now)).toBe(false);
    expect(matchesCriteria({...hilux,colour:'Unknown'},{colourId:'14'},now)).toBe(true);
    expect(JSON.stringify(buildWhere({colourId:'1'}))).not.toContain('colour');
  });
});
