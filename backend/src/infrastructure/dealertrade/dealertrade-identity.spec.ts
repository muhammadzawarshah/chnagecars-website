import { DealerTradeIdentityService, importedDealerUuid } from './dealertrade-identity.service';

const vehicleId = '11111111-1111-4111-a111-111111111111';
const dealerId = importedDealerUuid('3975');
function service() {
  const identities = new DealerTradeIdentityService({} as any);
  identities.setIdentities([{ id: vehicleId, sourceId: '1556378', dealerId, sourceDealerId: '3975' }], [{ id: dealerId, slug: 'dealer-name-3975' }], ['3975']);
  jest.spyOn(identities, 'refresh').mockResolvedValue(undefined);
  return identities;
}

describe('original DealerTrade IDs at the HTTP boundary', () => {
  it('presents vehicle/dealer identities without changing names, slugs, dates or unrelated IDs', () => {
    const identities = service();
    const input = { id: vehicleId, dealer: { id: dealerId, name: 'Original Dealer Name' }, slug: 'original-1556378', userId: 'unrelated', publishedAt: new Date('2026-01-01'), vehicleId, images: [{ id: 'image-id' }] };
    expect(identities.present(input)).toEqual({ ...input, id: '1556378', vehicleId: '1556378', dealer: { id: '3975', name: 'Original Dealer Name' } });
    expect(input.id).toBe(vehicleId);
    expect(identities.present([vehicleId, vehicleId.replace(/-/g, '')])).toEqual(['1556378', '1556378']);
  });
  it.each([
    ['/api/v1/vehicles/1556378', `/api/v1/vehicles/${vehicleId}`],
    ['/api/v1/vehicles/1556378/similar', `/api/v1/vehicles/${vehicleId}/similar`],
    ['/api/v1/me/favourites/1556378', `/api/v1/me/favourites/${vehicleId}`],
    ['/api/v1/web/cars/1556378', `/api/v1/web/cars/${vehicleId.replace(/-/g, '')}`],
    ['/api/v1/dealers/3975', '/api/v1/dealers/dealer-name-3975'],
    ['/api/v1/vehicles/9999999', '/api/v1/vehicles/9999999'],
    ['/api/v1/admin/vehicles/1556378', '/api/v1/admin/vehicles/1556378'],
    ['/api/v1/dealer-app/vehicles/1556378', '/api/v1/dealer-app/vehicles/1556378'],
    ['/api/v1/dealer/vehicles/1556378', '/api/v1/dealer/vehicles/1556378'],
  ])('resolves request %s', async (url, expected) => {
    const identities = service(); const req = { url } as any; const next = jest.fn();
    await identities.request(req, {} as any, next);
    expect(req.url).toBe(expected); expect(next).toHaveBeenCalledWith();
  });
  it('resolves compare/dealer queries and numeric enquiry body IDs before UUID validation', async () => {
    const identities = service();const req = {url:'/api/v1/vehicles/compare?ids=1556378&dealer=3975',body:{vehicleId:1556378,dealerId:'3975',name:'Keep Name'}} as any;
    await identities.request(req, {} as any, jest.fn());
    const url = new URL(req.url,'http://local');
    expect(url.searchParams.get('ids')).toBe(vehicleId);expect(url.searchParams.get('dealer')).toBe('dealer-name-3975');
    expect(req.body).toEqual({vehicleId,dealerId,name:'Keep Name'});
  });
  it('resolves the website enquiry carId without changing form names', async () => {
    const identities = service(); const req = {url:'/api/v1/web/forms/car-detail',body:{carId:'1556378',name:'Original Name'}} as any;
    await identities.request(req, {} as any, jest.fn());
    expect(req.body).toEqual({carId:vehicleId.replace(/-/g, ''),name:'Original Name'});
  });
  it('rejects conflicting source identities rather than attaching a car to another dealer', () => {
    const identities = service();
    expect(() => identities.setIdentities([
      { id: vehicleId, sourceId: '1556378', dealerId, sourceDealerId: '3975' },
      { id: '22222222-2222-4222-a222-222222222222', sourceId: '1556378', dealerId, sourceDealerId: '3975' },
    ],[{id:dealerId,slug:'dealer'}],['3975'])).toThrow('Duplicate');
  });
});


it('uses original IDs directly when they are the real database primary keys', () => {
  const identities = new DealerTradeIdentityService({} as any);
  identities.setIdentities([{ id: '1556517', sourceId: '1556517', dealerId: '3095', sourceDealerId: '3095' }], [{ id: '3095', slug: 'audi-original' }], ['3095']);
  expect(identities.present({ id: '1556517', dealer: { id: '3095', name: 'Original Name' } })).toEqual({ id: '1556517', dealer: { id: '3095', name: 'Original Name' } });
});
