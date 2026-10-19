import { PublicVehiclesService } from './public-vehicles.service';

function setup(year: number | null = 2024) {
  const vehicle = { findUnique: jest.fn().mockResolvedValue({ modelId: 'model', variantId: 'variant', year, price: 120000, mileage: 0, publishedAt: new Date(Date.now() - 10 * 86400000) }), aggregate: jest.fn().mockResolvedValue({ _avg: { price: 100000, mileage: 15000 }, _count: { price: 3, mileage: 3 } }) };
  const daily = { aggregate: jest.fn().mockResolvedValue({ _sum: { views: 12 } }) };
  const enquiry = { count: jest.fn().mockResolvedValue(2) };
  const service = new PublicVehiclesService({ replica: { vehicle, vehicleViewDaily: daily, enquiry } } as any, {} as any, {} as any, null);
  return { service, vehicle, daily, enquiry };
}
it('compares real comparable stock, preserves zero mileage and counts only recent local activity', async () => {
  const { service, vehicle, daily, enquiry } = setup();
  expect(await service.listingInsights('1521740')).toMatchObject({ source: 'this-site', priceDifference: 20000, mileageDifference: -15000, viewsLast7Days: 12, enquiriesLast7Days: 2, daysListed: 10 });
  expect(vehicle.aggregate.mock.calls[0][0].where).toMatchObject({ id: { not: '1521740' }, variantId: 'variant', modelId: 'model', year: { gte: 2023, lte: 2025 }, dealer: { status: 'APPROVED' } });
  expect(daily.aggregate.mock.calls[0][0].where).toMatchObject({ vehicleId: '1521740', day: { gte: expect.any(Date), lte: expect.any(Date) } });
  expect(enquiry.count.mock.calls[0][0].where).toMatchObject({ vehicleId: '1521740', createdAt: { gte: expect.any(Date), lte: expect.any(Date) } });
});
it('does not invent a comparison when year or enough comparable records are unavailable', async () => {
  const missing = setup(null);
  expect(await missing.service.listingInsights('id')).toMatchObject({ averagePrice: null, priceDifference: null, averageMileage: null, mileageDifference: null });
  expect(missing.vehicle.aggregate).not.toHaveBeenCalled();
  const small = setup();
  small.vehicle.aggregate.mockResolvedValue({ _avg: { price: 100000, mileage: 15000 }, _count: { price: 2, mileage: 1 } });
  expect(await small.service.listingInsights('id')).toMatchObject({ averagePrice: null, averageMileage: null });
});
