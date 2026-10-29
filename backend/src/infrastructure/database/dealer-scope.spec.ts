import { dealerScopeMiddleware, dealerScopeStorage, scopedArgs } from './dealer-scope';

const scope = { dealerIds: ['3490', '3491'], path: '/api/v1/scope/3490,3491' };

describe('dealer app scope', () => {
  it('adds the dealer filter to reads of scoped models and keeps existing conditions', () => {
    expect(scopedArgs('Vehicle', 'findMany', { where: { status: 'PUBLISHED', AND: [{ price: { gt: 1 } }] } }, scope)).toEqual({
      where: { status: 'PUBLISHED', AND: [{ price: { gt: 1 } }, { dealerId: { in: ['3490', '3491'] } }] },
    });
    expect(scopedArgs('Vehicle', 'findUnique', { where: { id: '1' } }, scope)).toEqual({ where: { id: '1', AND: [{ dealerId: { in: ['3490', '3491'] } }] } });
    expect(scopedArgs('Dealer', 'count', undefined, scope)).toEqual({ where: { AND: [{ id: { in: ['3490', '3491'] } }] } });
    expect(scopedArgs('Favourite', 'findMany', { where: { userId: 'u' } }, scope)).toEqual({ where: { userId: 'u', AND: [{ vehicle: { dealerId: { in: ['3490', '3491'] } } }] } });
    expect(scopedArgs('Make', 'findMany', {}, scope)).toEqual({ where: { AND: [{ vehicles: { some: { dealerId: { in: ['3490', '3491'] } } } }] } });
  });

  it('leaves writes, unscoped models and requests outside a scope alone', () => {
    const args = { where: { id: '1' }, data: { viewCount: 2 } };
    expect(scopedArgs('Vehicle', 'update', args, scope)).toBe(args);
    expect(scopedArgs('Article', 'findMany', args, scope)).toBe(args);
    expect(scopedArgs('Vehicle', 'findMany', args)).toBe(args);
  });

  async function run(url: string, known: string[] = ['3490', '3491']) {
    const req = { url, originalUrl: url, method: 'GET' } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), req } as any;
    let seen: { url: string; scope?: unknown } | undefined;
    const next = jest.fn(() => { seen = { url: req.url, scope: dealerScopeStorage.getStore() }; });
    await dealerScopeMiddleware('api/v1', async (ids) => ids.filter((id) => known.includes(id)))(req, res, next);
    return { res, next, seen };
  }

  it('rewrites scoped URLs to the normal API and runs them inside the scope', async () => {
    const { seen } = await run('/api/v1/scope/3491,3490,3490/vehicles?page=2&make=bmw');
    expect(seen).toEqual({ url: '/api/v1/vehicles?page=2&make=bmw', scope });
    expect((await run('/api/v1/vehicles?page=1')).seen).toEqual({ url: '/api/v1/vehicles?page=1', scope: undefined });
  });

  it('rejects bad or unknown dealer IDs and staff APIs', async () => {
    const bad = await run('/api/v1/scope/abc/vehicles');
    expect(bad.res.status).toHaveBeenCalledWith(400);
    const unknown = await run('/api/v1/scope/3490,9/vehicles');
    expect(unknown.res.status).toHaveBeenCalledWith(404);
    expect(unknown.res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'DEALER_NOT_FOUND', details: ['9'] }));
    for (const path of ['admin/vehicles', 'dealer/vehicles', 'web/dashboard/overview', 'dealer-app/dealers/3490']) {
      const blocked = await run(`/api/v1/scope/3490/${path}`);
      expect(blocked.res.status).toHaveBeenCalledWith(404);
      expect(blocked.next).not.toHaveBeenCalled();
    }
  });
});
