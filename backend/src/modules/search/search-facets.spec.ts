import { SearchService } from './search.service';
import { buildWhere } from './search.builder';
import { filterVehicleSelect } from './filter-data';

describe('dependent filter counts', () => {
  it('reads matching stock once and returns scoped options with merged colours and zero mileage', async () => {
    const criteria = { make: 'audi', category: 'suvs', maxPrice: 500000, colour: 'Black,White' };
    const row = { id: '1', slug: 'car', title: 'Audi Q3', price: 100, year: null, mileage: 0, seats: 5, cylinders: 4, engineCapacityCc: 1400, powerKw: null, colour: 'BLACK', city: 'Pretoria', drivetrain: null, fuelType: 'DIESEL', transmission: 'AUTOMATIC', province: 'Gauteng', condition: 'USED', isSpecial: false, isFeatured: false, popularityScore: 0, make: { slug: 'audi', name: 'Audi' }, model: { slug: 'q3', name: 'Q3' }, variant: null, dealer: { slug: 'dealer-one', name: 'Dealer One' }, categories: [{ slug: 'suvs', name: 'SUV', isActive: true }] };
    const findMany = jest.fn().mockResolvedValue([row, { ...row, id: '2', colour: 'Black', isSpecial: true }, { ...row, id: '3', mileage: 1000 }]);
    const cache = { versionedKey: jest.fn(async () => 'key'), wrap: jest.fn(async (_key, _ttl, loader) => loader()) };
    const result = await new SearchService({ replica: { vehicle: { findMany } } } as never, cache as never).facets(criteria);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({ where: buildWhere(criteria), select: filterVehicleSelect });
    expect(result.total).toBe(3);
    expect(result.seats).toEqual([{ value: 5, count: 3 }]);
    expect(result.cylinders).toEqual([{ value: 4, count: 3 }]);
    expect(result.engineCapacityCc).toEqual([{ value: 1400, count: 3 }]);
    expect(result.powerKw).toEqual([]);
    expect(result.dealerships).toEqual([{ slug: 'dealer-one', name: 'Dealer One', count: 3 }]);
    expect(result.models).toEqual([{ slug: 'q3', name: 'Q3', make: 'audi', value: 'audi:q3', count: 3 }]);
    expect(result.colour).toHaveLength(16);
    expect(result.colour.find(c => c.id === 3)).toMatchObject({ value: 'black', name: 'Black', count: 3, stockCount: 3 });
    expect(result.colour.find(c => c.id === 15)).toMatchObject({ count: 0 });
    expect(result.variants).toEqual([]);
    expect(result.drivetrain).toEqual([]);
    expect(result.categories).toEqual([{ slug: 'suvs', name: 'SUV', count: 3 }]);
    expect(result.ranges.year).toEqual({ min: null, max: null });
    expect(result.ranges.mileage).toEqual({ min: 0, max: 1000 });
    expect(result.specials).toEqual([{ value: 'Not on special', count: 2 }, { value: 'On special', count: 1 }]);
  });
});
