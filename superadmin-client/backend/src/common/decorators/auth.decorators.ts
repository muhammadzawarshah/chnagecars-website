import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../generated/prisma/client';
import type { AuthUser } from '../types/auth-user';

export const IS_PUBLIC_KEY = 'auth:isPublic';
export const OPTIONAL_AUTH_KEY = 'auth:optional';
export const ROLES_KEY = 'auth:roles';

/** Endpoint needs no authentication. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Endpoint is public, but a valid bearer token (if sent) still identifies the user. */
export const OptionalAuth = () => SetMetadata(OPTIONAL_AUTH_KEY, true);

/** Restrict to platform roles. SUPER_ADMIN always satisfies ADMIN. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Injects the authenticated user (or undefined on optional-auth routes). */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
  return ctx.switchToHttp().getRequest().user;
});
