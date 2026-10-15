import { buildFilterData, filterVehicleSelect } from './filter-data';
import { buildWhere } from './search.builder';
import { SearchService } from './search.service';

describe('complete local filter snapshot', () => {
  const row = {
    id: 'one', slug: 'one', title: 'Audi Q3', status: 'PUBLISHED',
    price: 200000, year: 2020, mileage: 5000, seats: 5,
    engineCapacityCc: 1400, powerKw: null, colour: ' Black ', condition: 'USED',
    transmission: 'AUTOMATIC', fuelType: 'PETROL', drivetrain: null,
    province: 'GAUTENG', city: 'Pretoria', branchId: null,
    isSpecial: false, isFeatured: true, publishedAt: new Date(),
    latitude: null, longitude: null, popularityScore: 1,
    make: { slug: 'audi', name: 'Audi' }, model: { slug: 'q3', name: 'Q3' },
    variant: { slug: 'sport', name: 'Sport' }, dealer: { slug: 'dealer', name: 'Dealer' },
    categories: [{ slug: 'suvs', name: 'SUVs', isActive: true }],
  };

  it('preserves relationships across makes and computes options from the same complete dataset', () => {
    const other = { ...row, id: 'two', price: 300000, seats: 7, colour: 'BLACK', status: 'RESERVED',
      make: { slug: 'other', name: 'Other' }, popularityScore: 0 };
    const result = buildFilterData([row, other] as never);
    expect(result.total).toBe(2);
    expect(result.options.models.map((item) => item.value)).toEqual(['audi:q3', 'other:q3']);
    expect(result.options.variants).toHaveLength(2);
    expect(result.options.colour).toEqual([{ value: 'black', count: 2 }]);
    expect(result.options.powerKw).toEqual([]);
    expect(result.ranges.price).toEqual({ min: 200000, max: 300000 });
    expect(result.ranges.powerKw).toEqual({ min: null, max: null });
    expect(result.vehicles[1]).toMatchObject({ status: 'RESERVED', isHotSeller: false });
    expect(result.vehicles[0]).not.toHaveProperty('popularityScore');
    // Local combination can recover the correct colour options and total without another API call.
    const selected = result.vehicles.filter((item) => item.make.slug === 'audi' && item.price <= 250000);
    expect(selected.map((item) => item.id)).toEqual(['one']);
    expect(selected[0].colour).toBe('black');
  });

  it('returns valid empty options and null ranges when there are no public listings', () => {
    const result = buildFilterData([]);
    expect(result.total).toBe(0);
    expect(result.vehicles).toEqual([]);
    for (const options of Object.values(result.options)) expect(options).toEqual([]);
    for (const range of Object.values(result.ranges)) expect(range).toEqual({ min: null, max: null });
  });

  it('loads all publicly visible listings without pagination or selected filters and uses versioned caching', async () => {
    const findMany = jest.fn(async () => [row]);
    const cache = { versionedKey: jest.fn(async () => 'snapshot-key'), wrap: jest.fn(async (_key, _ttl, loader) => loader()) };
    const service = new SearchService({ replica: { vehicle: { findMany } } } as never, cache as never);
    const result = await service.allFilterData();
    expect(findMany).toHaveBeenCalledWith({ where: buildWhere({}), select: filterVehicleSelect, orderBy: { id: 'asc' } });
    expect(cache.wrap).toHaveBeenCalledWith('snapshot-key', 120, expect.any(Function));
    expect(result.total).toBe(1);
  });
});
