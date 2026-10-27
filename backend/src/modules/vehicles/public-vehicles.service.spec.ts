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
  it('uses supplier colour in detail and specifications while preserving recommendation colours', async () => {
    const { service, vehicle } = setup();
    vehicle.findFirst.mockResolvedValue({ ...card('base'), colour: 'White',
      sourceData: { importPolicy: 'dealertrade-only', dealertrade: { colour: 'PURE WHITE' } },
      city: 'Pretoria', province: 'Gauteng', dealer: { address: '' }, branch: null });
    jest.spyOn(service, 'fromSameDealer').mockResolvedValue([{ ...card('related'), colour: 'White' }] as any);
    jest.spyOn(service, 'similar').mockResolvedValue([]);
    jest.spyOn(service, 'listingInsights').mockResolvedValue({ source: 'this-site' } as any);
    jest.spyOn(service as any, 'recordView').mockResolvedValue(undefined);
    const result = await service.detail('base');
    expect(result.colour).toBe('Pure White');
    expect(result.technicalSpecifications.colour).toBe('Pure White');
    expect(result.moreFromThisDealer[0]).toMatchObject({ colour: 'White' });
    expect(result).not.toHaveProperty('sourceData');
  });

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
    vehicle.findFirst.mockResolvedValue({ ...card('base'), description: 'Full dealer information', city: 'Bethlehem', province: 'Free State', latitude: null, longitude: null, dealer: { address: 'Dealer address' }, branch: { address: 'Branch address', latitude: -28, longitude: 28 }, makeId: 'make', modelId: 'model', dealerId: 'dealer' });
    jest.spyOn(service, 'fromSameDealer').mockResolvedValue([card('dealer-car')] as any);
    jest.spyOn(service, 'similar').mockResolvedValue([card('similar-car')] as any);
    jest.spyOn(service as any, 'recordView').mockResolvedValue(undefined);
    jest.spyOn(service, 'listingInsights').mockResolvedValue({ source: 'this-site' } as any);
    const result = await service.detail('base-slug');
    expect(result.location).toEqual({ city: 'Bethlehem', province: 'Free State', address: 'Branch address', latitude: -28, longitude: 28, country: 'South Africa' });
    expect(result.additionalInformation).toBe('Full Dealer Information');
    expect(result.mapDetails.googleMapsUrl).toContain('query=-28%2C28');
    expect(result.mapDetails.embedUrl).toContain('q=-28%2C28&output=embed');
    expect(result.moreFromThisDealer[0].id).toBe('dealer-car');
    expect(result.youMightLike[0].id).toBe('similar-car');
    expect(result.moreFromThisDealer[0]).not.toHaveProperty('moreFromThisDealer');
  });

  it('does not borrow catalogue features for a source-only imported listing', async () => {
    const { service, vehicle } = setup();
    vehicle.findFirst.mockResolvedValue({ ...card('base'), sourceData: { importPolicy: 'dealertrade-only', dealertrade: { vehicle_id: 123 } }, city: '', province: 'Gauteng', latitude: null, longitude: null, dealer: { address: '' }, branch: null, makeId: 'make', modelId: 'model', dealerId: 'dealer' });
    jest.spyOn(service, 'fromSameDealer').mockResolvedValue([]);
    jest.spyOn(service, 'similar').mockResolvedValue([]);
    jest.spyOn(service, 'listingInsights').mockResolvedValue({ source: 'this-site' } as any);
    jest.spyOn(service as any, 'recordView').mockResolvedValue(undefined);
    expect((await service.detail('base-slug')).features).toEqual([]);
    expect((service as any).catalogue.resolveFeatures).not.toHaveBeenCalled();
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

describe('DealerTrade stock summary', () => {
  const live = (body: unknown, ok = true) => jest.spyOn(global, 'fetch').mockResolvedValue({ ok, status: ok ? 200 : 503, json: async () => body } as any);
  const service = () => new PublicVehiclesService({} as any, {} as any, {} as any, null);
  beforeEach(() => { process.env.DEALERTRADE_TOKEN = 'test-token'; });
  afterEach(() => { jest.restoreAllMocks(); delete process.env.DEALERTRADE_TOKEN; });

  it('reads separate stock and pagination counts live from the DealerTrade API without exposing arbitrary metadata', async () => {
    const fetchMock = live({ meta: { total_stock_count: 38654, last_updated: '2026-10-27 17:05:51', private: 'hidden' }, total: 38990, data: [{}] });
    const summary = await service().sourceSummary();
    expect(summary).toEqual({ source: 'dealertrade', total_stock_count: 38654, last_updated: '2026-10-27 17:05:51', total: 38990, fetchedAt: expect.any(Date) });
    expect(fetchMock.mock.calls[0][0]).toBe('https://dealertrade.co.za/api/apk/stock/by-dealers?page=1&per_page=1');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', headers: expect.objectContaining({ authorization: 'Bearer test-token' }) });
  });
  it('returns unknown counts as null and preserves a real zero count', async () => {
    live({ meta: { total_stock_count: 0, last_updated: null }, total: -1 });
    expect(await service().sourceSummary()).toMatchObject({ total_stock_count: 0, total: null, last_updated: null });
  });
  it('shares one live call for a minute and keeps the last live result when the API fails', async () => {
    const fetchMock = live({ meta: { total_stock_count: 38654 }, total: 38990 });
    const instance = service();
    await Promise.all([instance.sourceSummary(), instance.sourceSummary()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);
    fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) } as any);
    expect(await instance.sourceSummary()).toMatchObject({ total_stock_count: 38654 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('returns nulls when the API has never answered', async () => {
    live({}, false);
    expect(await service().sourceSummary()).toMatchObject({ total_stock_count: null, total: null, fetchedAt: null });
  });
});


describe('combined search button count', () => {
  it('uses the supplier count only for an unrestricted search, preserving zero and fallback', async () => {
    const { service } = setup();
    const source = jest.spyOn(service, 'sourceSummary');
    source.mockResolvedValue({ total_stock_count: 38904 } as any);
    expect(await service.searchButtonCount({}, 44500)).toMatchObject({ total: 38904, localTotal: 44500, formatted: '38 904' });
    expect(await service.searchButtonCount({ make: 'toyota' }, 120)).toMatchObject({ total: 120 });
    expect(await service.searchButtonCount({ colourId: '1' }, 44500)).toMatchObject({ total: 38904 });
    source.mockResolvedValue({ total_stock_count: 0 } as any);
    expect(await service.searchButtonCount({}, 44500)).toMatchObject({ total: 0 });
    source.mockResolvedValue({ total_stock_count: null } as any);
    expect(await service.searchButtonCount({}, 44500)).toMatchObject({ total: 44500 });
  });
});
