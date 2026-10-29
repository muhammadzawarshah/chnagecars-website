import { SearchService } from './search.service';

describe('recent vehicle browse', () => {
  it.each([undefined, 'recent' as const])('lists newest first across dealers, paginated in the database, for sort %s', async sort => {
    const vehicle = { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) };
    const cache = { versionedKey: jest.fn().mockResolvedValue('key'), wrap: jest.fn().mockImplementation((_k, _t, fn) => fn()) };
    const service = new SearchService({ replica: { vehicle } } as any, cache as any);
    await service.search({ sort, page: 2, pageSize: 3 });
    expect(vehicle.findMany).toHaveBeenCalledTimes(1);
    expect(vehicle.findMany.mock.calls[0][0]).toMatchObject({ orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }], skip: 3, take: 3 });
  });
});
