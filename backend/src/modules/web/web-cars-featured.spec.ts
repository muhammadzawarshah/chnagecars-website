import { dealerScopeStorage } from '../../infrastructure/database/dealer-scope';
import { WebCarsService } from './web-cars.service';

function setup(featured: string[], others: string[]) {
  const findMany = jest.fn(async ({ where, select }) => {
    if (select.id && Object.keys(select).length === 1) return (JSON.stringify(where).includes('"isFeatured":true') ? featured : others).map(id => ({ id }));
    return where.id.in.map((id: string) => ({ id, price: 1, specialPrice: null, isSpecial: false, condition: 'USED', fuelType: 'PETROL', transmission: 'MANUAL',
      categories: [], images: [], imageCount: 0, make: { name: 'Ford' }, model: { name: 'Ranger' }, dealer: { id: '3490', name: 'Dealer' },
      createdAt: new Date('2026-01-01'), province: 'Gauteng', city: 'Midrand' }));
  });
  return { service: new WebCarsService({ replica: { vehicle: { findMany } } } as any, {} as any), findMany };
}

describe('featured cars', () => {
  it('fills a dealer app with its own cars when ChangeCars featured too few of them', async () => {
    const { service } = setup(['f1'], ['a', 'b', 'c', 'd']);
    const cars = await dealerScopeStorage.run({ dealerIds: ['3490'], path: '/api/v1/scope/3490' }, () => service.featured(4));
    expect(cars.map(car => car.id)[0]).toBe('f1');
    expect(cars).toHaveLength(4);
    expect(new Set(cars.map(car => car.id)).size).toBe(4);
  });

  it('keeps the ChangeCars app to featured cars only', async () => {
    const { service, findMany } = setup(['f1'], ['a', 'b']);
    expect((await service.featured(4)).map(car => car.id)).toEqual(['f1']);
    expect(findMany).toHaveBeenCalledTimes(2);
  });
});
