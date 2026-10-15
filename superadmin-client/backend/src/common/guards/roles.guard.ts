import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../generated/prisma/client';
import { ROLES_KEY } from '../decorators/auth.decorators';
import { Errors } from '../errors/app-error';
import type { AuthUser } from '../types/auth-user';

/** Platform-level RBAC (NFR-05). Dealer staff permissions are enforced by DealerAccessGuard. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const user: AuthUser | undefined = context.switchToHttp().getRequest().user;
    if (!user) throw Errors.unauthorized();
    if (roles.includes(user.role)) return true;
    if (user.role === UserRole.SUPER_ADMIN && roles.includes(UserRole.ADMIN)) return true;
    throw Errors.forbidden();
  }
}
