import { WebCarsService } from './web-cars.service';

it('uses the detail colour on web detail while list cards keep the stored colour', async () => {
  const row = { id: '123', colour: 'White', price: 100000, specialPrice: null, isSpecial: false,
    condition: 'USED', fuelType: 'PETROL', transmission: 'MANUAL', categories: [], images: [], imageCount: 0,
    make: { name: 'Ford' }, model: { name: 'Ranger' }, dealer: { id: '1', name: 'Dealer' },
    createdAt: new Date('2026-01-01'), province: 'Gauteng', city: 'Pretoria' };
  const db = { vehicle: { findMany: jest.fn().mockResolvedValue([row]) } };
  const publicVehicles = { detail: jest.fn().mockResolvedValue({ colour: 'FROZEN WHITE',
    technicalSpecifications: { colour: 'FROZEN WHITE' }, moreFromThisDealer: [], youMightLike: [] }) };
  const service = new WebCarsService({ replica: db } as any, publicVehicles as any);
  jest.spyOn(service as any, 'findRow').mockResolvedValue(row);
  expect((await service.get('123'))?.colour).toBe('FROZEN WHITE');
  expect((await service.get('123'))?.technicalSpecifications.colour).toBe('FROZEN WHITE');
  expect((await service.all())[0].colour).toBe('White');
  expect(row.colour).toBe('White');
});
