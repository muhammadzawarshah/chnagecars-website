import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

/**
 * Dealer apps call the normal public API under /api/v1/scope/{dealerIds}/... and only ever see those dealers'
 * data. The scope lives for the request; every public read of the models below gets the dealer filter.
 */
export type DealerScope = { dealerIds: string[]; path: string };

export const dealerScopeStorage = new AsyncLocalStorage<DealerScope>();
export const currentDealerScope = () => dealerScopeStorage.getStore();

const MAX_DEALERS = 20;
/** Staff, admin and dealer-portal APIs are never served inside a dealer scope. */
const BLOCKED = /^(admin|dealer|dealer-app|health)(\/|$)|^web\/dashboard(\/|$)/;

const scoped: Record<string, (ids: string[]) => object> = {
  vehicle: (ids) => ({ dealerId: { in: ids } }),
  dealer: (ids) => ({ id: { in: ids } }),
  branch: (ids) => ({ dealerId: { in: ids } }),
  favourite: (ids) => ({ vehicle: { dealerId: { in: ids } } }),
  recentlyViewed: (ids) => ({ vehicle: { dealerId: { in: ids } } }),
  featuredDealer: (ids) => ({ dealerId: { in: ids } }),
  make: (ids) => ({ vehicles: { some: { dealerId: { in: ids } } } }),
  model: (ids) => ({ vehicles: { some: { dealerId: { in: ids } } } }),
};
const READS = new Set(['findMany', 'findFirst', 'findFirstOrThrow', 'findUnique', 'findUniqueOrThrow', 'count', 'aggregate', 'groupBy']);

/** The query arguments with the scope added; unchanged for writes, unscoped models or outside a scope. */
export function scopedArgs<A>(model: string, operation: string, args: A, scope = dealerScopeStorage.getStore()): A {
  const filter = scope && READS.has(operation) ? scoped[model.charAt(0).toLowerCase() + model.slice(1)] : undefined;
  if (!scope || !filter) return args;
  const where = ((args as { where?: Record<string, unknown> } | undefined)?.where ?? {});
  const and = where.AND === undefined ? [] : Array.isArray(where.AND) ? where.AND : [where.AND];
  return { ...(args as object), where: { ...where, AND: [...and, filter(scope.dealerIds)] } } as A;
}

export const dealerScopeExtension = Prisma.defineExtension({
  name: 'dealer-scope',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        return query(scopedArgs(model, operation, args));
      },
    },
  },
});

function reject(res: Response, status: number, code: string, message: string, details?: string[]) {
  res.status(status).json({ statusCode: status, code, message, ...(details ? { details } : {}), timestamp: new Date().toISOString(), path: res.req.originalUrl });
}

/**
 * Rewrites /{prefix}/scope/{ids}/{path} to /{prefix}/{path} and runs the rest of the request inside the scope.
 * `knownDealers` returns which of the IDs are approved dealers.
 */
export function dealerScopeMiddleware(prefix: string, knownDealers: (ids: string[]) => Promise<string[]>) {
  const base = `/${prefix.replace(/^\/+|\/+$/g, '')}/scope/`;
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.url.startsWith(base)) return next();
    const [path, search = ''] = req.url.slice(base.length).split(/\?(.*)/s);
    const slash = path.indexOf('/');
    const rest = slash < 0 ? '' : path.slice(slash + 1);
    // Sorted, so 3491,3490 and 3490,3491 share caches and snapshots.
    const ids = [...new Set(decodeURIComponent(slash < 0 ? path : path.slice(0, slash)).split(',').map((id) => id.trim()).filter(Boolean))].sort((a, b) => Number(a) - Number(b));
    if (!ids.length || ids.length > MAX_DEALERS || ids.some((id) => !/^\d{1,10}$/.test(id))) {
      return reject(res, 400, 'BAD_REQUEST', `Dealer scope must be 1 to ${MAX_DEALERS} numeric dealer IDs, comma-separated`);
    }
    if (!rest || BLOCKED.test(rest)) return reject(res, 404, 'NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`);
    try {
      const known = new Set(await knownDealers(ids));
      const missing = ids.filter((id) => !known.has(id));
      if (missing.length) return reject(res, 404, 'DEALER_NOT_FOUND', 'Dealer not found', missing);
    } catch (error) {
      return next(error);
    }
    req.url = `/${prefix.replace(/^\/+|\/+$/g, '')}/${rest}${search ? `?${search}` : ''}`;
    dealerScopeStorage.run({ dealerIds: ids, path: `${base}${ids.join(',')}` }, () => next());
  };
}
