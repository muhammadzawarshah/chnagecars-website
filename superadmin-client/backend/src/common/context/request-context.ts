import { ClsServiceManager } from 'nestjs-cls';
import type { AuthUser } from '../types/auth-user';

/** Per-request values stored in AsyncLocalStorage (nestjs-cls). */
export interface RequestContextStore {
  requestId?: string;
  ip?: string;
  userAgent?: string;
  user?: AuthUser;
}

/** Read the current request context from anywhere (services, audit, logging). */
export function requestContext(): RequestContextStore {
  const cls = ClsServiceManager.getClsService();
  if (!cls.isActive()) return {};
  return {
    requestId: cls.getId(),
    ip: cls.get('ip'),
    userAgent: cls.get('userAgent'),
    user: cls.get('user'),
  };
}
