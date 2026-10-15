import { SearchService } from './search.service';
import { buildWhere } from './search.builder';

describe('dependent filter counts', () => {
  it('applies combined criteria to every count and returns scoped models and merged colours', async () => {
    const criteria = { make: 'audi', category: 'suvs', maxPrice: 500000, colour: 'Black,White' };
    const groupBy = jest.fn(async ({ by }: { by: string[] }) => {
      const field = by[0];
      if (field === 'colour') return [{ colour: 'BLACK', _count: { _all: 2 } }, { colour: 'Black', _count: { _all: 1 } }];
      const values: Record<string, unknown> = { seats: 5, engineCapacityCc: 1400, powerKw: null, dealerId: 'd', makeId: 'a', modelId: 'q', variantId: null, city: 'Pretoria', drivetrain: null, fuelType: 'DIESEL', transmission: 'AUTOMATIC', province: 'GAUTENG', condition: 'USED' };
      return [{ [field]: values[field], _count: { _all: 3 } }];
    });
    const count = jest.fn(async () => 3);
    const db = {
      vehicle: { groupBy, count, aggregate: jest.fn(async () => ({ _min: { price: 1, year: 2020, mileage: 0 }, _max: { price: 500000, year: 2026, mileage: 1000 } })) },
      dealer: { findMany: jest.fn(async () => [{ id: 'd', slug: 'dealer-one', name: 'Dealer One' }]) },
      make: { findMany: jest.fn(async () => [{ id: 'a', slug: 'audi', name: 'Audi' }]) },
      model: { findMany: jest.fn(async () => [{ id: 'q', slug: 'q3', name: 'Q3', make: { slug: 'audi' } }]) },
      variant: { findMany: jest.fn(async () => []) },
      category: { findMany: jest.fn(async () => [{ id: 's', slug: 'suvs', name: 'SUVs' }]) },
    };
    const cache = { versionedKey: jest.fn(async () => 'key'), wrap: jest.fn(async (_key, _ttl, loader) => loader()) };
    const result = await new SearchService({ replica: db } as never, cache as never).facets(criteria);
    for (const [argument] of groupBy.mock.calls) expect(argument).toMatchObject({ where: buildWhere(criteria) });
    expect(result.total).toBe(3);
    expect(result.seats).toEqual([{ value: 5, count: 3 }]);
    expect(result.engineCapacityCc).toEqual([{ value: 1400, count: 3 }]);
    expect(result.powerKw).toEqual([]);
    expect(result.dealerships).toEqual([{ slug: 'dealer-one', name: 'Dealer One', count: 3 }]);
    expect(result.models).toEqual([{ slug: 'q3', name: 'Q3', make: 'audi', value: 'audi:q3', count: 3 }]);
    expect(result.colour).toEqual([{ value: 'black', name: 'Black', count: 3 }]);
    expect(result.variants).toEqual([]);
    expect(result.drivetrain).toEqual([]);
    expect(result.categories).toEqual([{ slug: 'suvs', name: 'SUVs', count: 3 }]);
    expect(count).toHaveBeenCalledWith({ where: buildWhere(criteria) });
  });
});
