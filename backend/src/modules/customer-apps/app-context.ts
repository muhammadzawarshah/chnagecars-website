import { GROUP1_APP_ID, GROUP1_DEALER_IDS } from './group1';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';
import { dealerScopeStorage, currentDealerScope } from '../../infrastructure/database/dealer-scope';
import { Errors } from '../../common/errors/app-error';

export const MAIN_APP = 'changecars';
export type CustomerAppContext = { id: string; name: string; dealerIds: string[]; resetUrl: string | null; enabled: boolean };
export const customerAppStorage = new AsyncLocalStorage<CustomerAppContext>();
export const currentAppId = () => customerAppStorage.getStore()?.id ?? MAIN_APP;

/** Legacy inventory URLs cannot implicitly create accounts in the platform directory. */
export function authAppId() {
  if (currentDealerScope() && !customerAppStorage.getStore()) {
    throw Errors.badRequest('APP_CONTEXT_REQUIRED', 'Use the registered app API base URL for authentication');
  }
  const appId = currentAppId();
  if (![MAIN_APP, GROUP1_APP_ID].includes(appId)) throw Errors.forbidden('GROUP1_ONLY', 'Only the Group1 branded app is enabled');
  return appId;
}

const BLOCKED = /^(admin|dealer|dealer-app|health)(\/|$)|^web\/dashboard(\/|$)|^dealers\/register(\/|$)/;

export function customerAppMiddleware(prefix: string, resolve: (id: string) => Promise<CustomerAppContext | null>) {
  const base = `/${prefix.replace(/^\/+|\/+$/g, '')}/apps/`;
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.url.startsWith(base)) return next();
    const reject = (status: number, code: string, message: string) => res.status(status).json({ statusCode: status, code, message });
    const [path, search = ''] = req.url.slice(base.length).split(/\?(.*)/s);
    const slash = path.indexOf('/');
    const id = slash < 0 ? path : path.slice(0, slash);
    const rest = slash < 0 ? '' : path.slice(slash + 1);
    if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(id) || id === MAIN_APP || id !== GROUP1_APP_ID || !rest || rest.startsWith('apps/') || rest.startsWith('scope/') || BLOCKED.test(rest)) {
      return reject(404, 'APP_NOT_FOUND', 'App endpoint not found');
    }
    try {
      const app = await resolve(id);
      if (!app?.enabled || app.id !== GROUP1_APP_ID || !app.dealerIds.length) return reject(404, 'APP_NOT_FOUND', 'App is unavailable');
      if (app.dealerIds.length !== GROUP1_DEALER_IDS.length || !GROUP1_DEALER_IDS.every(id => app.dealerIds.includes(id))) return reject(404, 'APP_NOT_FOUND', 'Group1 app configuration is invalid');
      req.url = `/${prefix.replace(/^\/+|\/+$/g, '')}/${rest}${search ? `?${search}` : ''}`;
      customerAppStorage.run(app, () => dealerScopeStorage.run({ dealerIds: [...app.dealerIds].sort(), path: `${base}${id}` }, () => next()));
    } catch (error) { next(error); }
  };
}
