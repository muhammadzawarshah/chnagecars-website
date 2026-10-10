import { SearchService } from './search.service';

describe('random dealer browse', () => {
  function setup(dealers = ['a', 'b']) {
    const vehicle = {
      groupBy: jest.fn().mockResolvedValue(dealers.map(dealerId => ({ dealerId, _count: { _all: 25 } }))),
      findMany: jest.fn().mockImplementation(async ({ where }) => {
        const id = where.AND[1].dealerId;
        return [{ id: `${id}-car`, status: 'PUBLISHED', price: 100000, specialPrice: null, isSpecial: false,
          dealer: { id, slug: id, name: id } }];
      }),
      count: jest.fn().mockResolvedValue(0),
    };
    const cache = { versionedKey: jest.fn().mockResolvedValue('key'), wrap: jest.fn().mockImplementation((_k, _t, fn) => fn()) };
    return { service: new SearchService({ replica: { vehicle } } as any, cache as any), vehicle, cache };
  }

  it('changes dealer on consecutive requests and returns only the selected dealer stock without caching', async () => {
    const { service, vehicle, cache } = setup();
    const first = await service.search({ make: 'toyota', pageSize: 5 });
    const second = await service.search({ make: 'toyota', pageSize: 5 });
    expect(first.data[0].dealer.id).not.toBe(second.data[0].dealer.id);
    expect(first.meta).toEqual({ page: 1, pageSize: 5, total: 25, pageCount: 5 });
    expect(vehicle.findMany.mock.calls[0][0]).toMatchObject({ take: 5, where: { AND: [{}, { dealerId: first.data[0].dealer.id }] } });
    expect(JSON.stringify(vehicle.groupBy.mock.calls[0][0].where)).toContain('toyota');
    expect(cache.wrap).not.toHaveBeenCalled();
  });

  it('handles one eligible dealer and no eligible dealers', async () => {
    const single = setup(['a']);
    expect((await single.service.search({})).data).toHaveLength(1);
    expect((await single.service.search({})).data).toHaveLength(1);
    const empty = setup([]);
    expect(await empty.service.search({})).toMatchObject({ data: [], meta: { total: 0 }, selectedDealer: null });
    expect(empty.vehicle.findMany).not.toHaveBeenCalled();
  });

  it.each([{ dealer: 'a', page: 2 }, { sort: 'recent' as const }, { branchId: 'branch' }])('preserves explicit dealer, sort and branch searches: %j', async query => {
    const { service, vehicle, cache } = setup();
    vehicle.findMany.mockResolvedValue([]);
    await service.search(query);
    expect(vehicle.groupBy).not.toHaveBeenCalled();
    expect(cache.wrap).toHaveBeenCalled();
    if ('page' in query) expect(vehicle.findMany.mock.calls[0][0].skip).toBe(20);
  });
});
