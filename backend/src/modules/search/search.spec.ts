import { buildOrderBy, buildWhere, criteriaKey, makeModelGroups, seatFilter } from './search.builder';
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
  province: 'GAUTENG',
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
    expect(matchesCriteria(hilux, { category: 'double-cabs', province: 'GAUTENG' }, now)).toBe(true);
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

  it('cache keys ignore parameter order and empty values', () => {
    expect(criteriaKey({ make: 'BMW', q: '', page: 1 })).toBe(criteriaKey({ page: 1, make: 'bmw' }));
  });
});
