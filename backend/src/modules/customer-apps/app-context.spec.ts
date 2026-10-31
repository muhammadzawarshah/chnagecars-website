import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { dealerScopeStorage, currentDealerScope } from '../../infrastructure/database/dealer-scope';
import { authAppId, currentAppId, customerAppMiddleware, customerAppStorage, MAIN_APP } from './app-context';

const app = { id: 'dealer-a', name: 'Dealer A', dealerIds: ['123'], enabled: true, resetUrl: 'https://dealer-a.example/reset' };
async function run(url: string, registered: typeof app | null = app) {
  const req = { url, originalUrl: url } as any;
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
  const resolve = jest.fn().mockResolvedValue(registered);
  let seen: unknown;
  const next = jest.fn(() => { seen = { appId: currentAppId(), scope: currentDealerScope(), url: req.url }; });
  await customerAppMiddleware('api/v1', resolve)(req, res, next);
  return { res, next, resolve, seen };
}

describe('registered customer app boundary', () => {
  it('uses the registered app and dealer scope while preserving query parameters', async () => {
    const result = await run('/api/v1/apps/dealer-a/auth/register?next=cars');
    expect(result.resolve).toHaveBeenCalledWith('dealer-a');
    expect(result.seen).toEqual({ appId: 'dealer-a', scope: { dealerIds: ['123'], path: '/api/v1/apps/dealer-a' }, url: '/api/v1/auth/register?next=cars' });
    expect(currentAppId()).toBe(MAIN_APP);
  });

  it('rejects unknown/disabled apps and nested or staff routes', async () => {
    expect((await run('/api/v1/apps/unknown/auth/register', null)).res.status).toHaveBeenCalledWith(404);
    expect((await run('/api/v1/apps/dealer-a/auth/register', { ...app, enabled: false })).res.status).toHaveBeenCalledWith(404);
    for (const rest of ['admin/users', 'dealer/vehicles', 'dealer-app/bootstrap', 'web/dashboard/overview', 'dealers/register', 'scope/1/auth/login', 'apps/another/auth/login']) {
      const result = await run(`/api/v1/apps/dealer-a/${rest}`);
      expect(result.next).not.toHaveBeenCalled();
      expect(result.res.status).toHaveBeenCalledWith(404);
    }
  });

  it('requires an explicit registered app for legacy inventory-scoped auth', () => {
    expect(() => dealerScopeStorage.run({ dealerIds: ['123'], path: '/scope/123' }, authAppId)).toThrow('registered app');
    expect(authAppId()).toBe(MAIN_APP);
  });

  it('rejects a valid JWT from another app even on an anonymous endpoint', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(true) };
    const guard = new JwtAuthGuard(reflector as unknown as Reflector,
      { verifyAsync: async () => ({ sub: 'other-user', appId: 'dealer-b' }) } as any, { isActive: () => false } as any);
    const request = { headers: { authorization: 'Bearer valid-jwt' } };
    const context = { getType: () => 'http', getHandler: () => ({}), getClass: () => ({}), switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
    await expect(customerAppStorage.run(app, () => guard.canActivate(context))).rejects.toThrow('another app');
  });

  it('preserves existing platform tokens without an appId claim', async () => {
    const request: any = { headers: { authorization: 'Bearer legacy-jwt' } };
    const guard = new JwtAuthGuard({ getAllAndOverride: () => false } as any,
      { verifyAsync: async () => ({ sub: 'existing', email: 'existing@example.com', sid: 'session', role: 'CUSTOMER' }) } as any,
      { isActive: () => false } as any);
    const context = { getType: () => 'http', getHandler: () => ({}), getClass: () => ({}), switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
    expect(await guard.canActivate(context)).toBe(true);
    expect(request.user.appId).toBe(MAIN_APP);
  });
});
