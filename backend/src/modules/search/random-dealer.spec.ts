import { SearchService } from './search.service';
import { interleaveDealers } from './dealer-order';

const points = [
  { id: 'a1', dealerId: 'a' }, { id: 'a2', dealerId: 'a' },
  { id: 'b1', dealerId: 'b' }, { id: 'a3', dealerId: 'a' },
  { id: 'c1', dealerId: 'c' }, { id: 'b2', dealerId: 'b' },
];

describe('stable mixed dealer browse', () => {
  function setup() {
    const vehicle = {
      findMany: jest.fn().mockImplementation(async ({ select, where }) => {
        if (select.dealerId) return points;
        const ids = where.AND[1].id.in;
        return [...ids].reverse().map((id: string) => ({ id, status: 'PUBLISHED', price: 100000,
          specialPrice: null, isSpecial: false, dealer: { id: id[0] } }));
      }),
      count: jest.fn().mockResolvedValue(0),
    };
    const cache = { versionedKey: jest.fn().mockResolvedValue('key'), wrap: jest.fn().mockImplementation((_k, _t, fn) => fn()) };
    return { service: new SearchService({ replica: { vehicle } } as any, cache as any), vehicle };
  }

  it('interleaves unequal dealer inventories without dropping or duplicating cars', () => {
    expect(interleaveDealers(points)).toEqual(['a1', 'b1', 'c1', 'a2', 'b2', 'a3']);
    expect(interleaveDealers([])).toEqual([]);
    expect(interleaveDealers(points.filter(p => p.dealerId === 'a'))).toEqual(['a1', 'a2', 'a3']);
  });

  it.each([undefined, 'recent' as const])('keeps repeated pages stable and pages disjoint for sort %s', async sort => {
    const { service, vehicle } = setup();
    const query = { sort, make: 'toyota', pageSize: 3 };
    const first = await service.search(query);
    const repeated = await service.search(query);
    const second = await service.search({ ...query, page: 2 });
    expect(first.data.map(x => x.id)).toEqual(['a1', 'b1', 'c1']);
    expect(repeated.data.map(x => x.id)).toEqual(first.data.map(x => x.id));
    expect(second.data.map(x => x.id)).toEqual(['a2', 'b2', 'a3']);
    expect(second.meta).toEqual({ page: 2, pageSize: 3, total: 6, pageCount: 2 });
    expect(JSON.stringify(vehicle.findMany.mock.calls[0][0].where)).toContain('toyota');
    expect((await service.search({ ...query, page: 3 })).data).toEqual([]);
  });

  it.each([{ dealer: 'a', page: 2 }, { sort: 'price-asc' as const }, { branchId: 'branch' }, { collection: 'hot-sellers' as const }])('preserves dealer/branch and other sorting: %j', async query => {
    const { service, vehicle } = setup();
    vehicle.findMany.mockResolvedValue([]);
    await service.search(query);
    expect(vehicle.findMany.mock.calls[0][0].select).not.toHaveProperty('dealerId');
    if ('page' in query) expect(vehicle.findMany.mock.calls[0][0].skip).toBe(20);
  });
});
