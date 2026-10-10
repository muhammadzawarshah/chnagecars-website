import { PublicVehiclesService } from './public-vehicles.service';

const card = (id: string) => ({ id, status: 'PUBLISHED', price: 200000, specialPrice: null, isSpecial: false });
function setup() {
  const vehicle = { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() };
  const service = new PublicVehiclesService(
    { replica: { vehicle } } as any,
    { versionedKey: jest.fn().mockResolvedValue('detail'), wrap: jest.fn((_key, _ttl, load) => load()) } as any,
    { resolveFeatures: jest.fn().mockResolvedValue([]) } as any,
    null,
  );
  return { service, vehicle };
}

describe('vehicle detail recommendations', () => {
  it('overlays favourites per user without modifying shared cards', async () => {
    const findMany = jest.fn().mockResolvedValueOnce([{ vehicleId: 'base' }]).mockResolvedValueOnce([]);
    const service = new PublicVehiclesService({ favourite: { findMany } } as any, {} as any, {} as any, null);
    const shared = [card('base'), card('other')];
    expect((await service.withFavouriteFlags(shared, 'user-a')).map(row => row.isFavourite)).toEqual([true, false]);
    expect((await service.withFavouriteFlags(shared, 'user-b')).map(row => row.isFavourite)).toEqual([false, false]);
    expect(findMany.mock.calls[0][0].where).toEqual({ userId: 'user-a', vehicleId: { in: ['base', 'other'] } });
    expect(shared[0]).not.toHaveProperty('isFavourite');
    expect((await service.withFavouriteFlags(shared)).every(row => !row.isFavourite)).toBe(true);
    expect(findMany).toHaveBeenCalledTimes(2);
  });

  it('includes location and both related sections without nesting detail responses', async () => {
    const { service, vehicle } = setup();
    vehicle.findFirst.mockResolvedValue({ ...card('base'), description: 'Full dealer information', city: 'Bethlehem', province: 'FREE_STATE', latitude: null, longitude: null, dealer: { address: 'Dealer address' }, branch: { address: 'Branch address', latitude: -28, longitude: 28 }, makeId: 'make', modelId: 'model', dealerId: 'dealer' });
    jest.spyOn(service, 'fromSameDealer').mockResolvedValue([card('dealer-car')] as any);
    jest.spyOn(service, 'similar').mockResolvedValue([card('similar-car')] as any);
    jest.spyOn(service as any, 'recordView').mockResolvedValue(undefined);
    const result = await service.detail('base-slug');
    expect(result.location).toEqual({ city: 'Bethlehem', province: 'FREE_STATE', address: 'Branch address', latitude: -28, longitude: 28, country: 'South Africa' });
    expect(result.additionalInformation).toBe('Full dealer information');
    expect(result.mapDetails.googleMapsUrl).toContain('query=-28%2C28');
    expect(result.mapDetails.embedUrl).toContain('q=-28%2C28&output=embed');
    expect(result.moreFromThisDealer[0].id).toBe('dealer-car');
    expect(result.youMightLike[0].id).toBe('similar-car');
    expect(result.moreFromThisDealer[0]).not.toHaveProperty('moreFromThisDealer');
  });

  it('prioritizes same-model stock and fills remaining slots with similar category/price cars', async () => {
    const { service, vehicle } = setup();
    vehicle.findUnique.mockResolvedValue({ id: 'base', modelId: 'model', price: 200000, categories: [{ id: 'suv' }] });
    vehicle.findMany.mockResolvedValueOnce([card('same-model')]).mockResolvedValueOnce([card('similar-body')]);
    const result = await service.similar('base', 2);
    expect(result.map(v => v.id)).toEqual(['same-model', 'similar-body']);
    expect(vehicle.findMany.mock.calls[0][0].where).toMatchObject({ id: { not: 'base' }, modelId: 'model', dealer: { status: 'APPROVED' } });
    expect(vehicle.findMany.mock.calls[1][0]).toMatchObject({ take: 1, where: { id: { notIn: ['base', 'same-model'] }, categories: { some: { id: { in: ['suv'] } } }, price: { gte: 150000, lte: 250000 }, dealer: { status: 'APPROVED' } } });
  });

  it('limits same-dealer suggestions to other publicly visible stock', async () => {
    const { service, vehicle } = setup();
    vehicle.findUnique.mockResolvedValue({ dealerId: 'dealer' });
    vehicle.findMany.mockResolvedValue([]);
    expect(await service.fromSameDealer('base')).toEqual([]);
    expect(vehicle.findMany.mock.calls[0][0]).toMatchObject({ take: 6, where: { dealerId: 'dealer', id: { not: 'base' }, status: { in: ['PUBLISHED', 'RESERVED'] }, dealer: { status: 'APPROVED' } } });
  });
});
