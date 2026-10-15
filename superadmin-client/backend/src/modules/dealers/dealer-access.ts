import {
  applyDecorators,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Global,
  Injectable,
  Module,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import {
  DealerMemberRole,
  DealerMemberStatus,
  DealerPermission,
  DealerStatus,
} from '../../generated/prisma/client';
import { Errors } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { effectivePermissions, hasDealershipWideScope } from './dealer-permissions';

/** Who is acting for which dealership, resolved server-side for every dealer request. */
export interface DealerContext {
  userId: string;
  memberId: string;
  dealerId: string;
  dealerStatus: DealerStatus;
  role: DealerMemberRole;
  branchId: string | null;
  permissions: DealerPermission[];
  /** Owners/managers see all branches; others only their own branch (if assigned). */
  wideScope: boolean;
}

export interface DealerAccessOptions {
  /** Member needs ALL of these permissions. */
  permissions?: DealerPermission[];
  /** Member needs AT LEAST ONE of these permissions. */
  anyPermission?: DealerPermission[];
  /** Require the dealership to be APPROVED (BR-02: publishing and bidding). */
  requireApproved?: boolean;
  /** Allow suspended/rejected dealerships (read-only profile pages). */
  allowInactive?: boolean;
}

export const DEALER_ACCESS_KEY = 'dealer:access';

/** Protects dealer-portal routes. Tenant isolation is always derived from the member record, never from client input. */
export const DealerAccess = (options: DealerAccessOptions = {}) =>
  applyDecorators(SetMetadata(DEALER_ACCESS_KEY, options), UseGuards(DealerAccessGuard));

export const CurrentDealer = createParamDecorator((_data: unknown, ctx: ExecutionContext): DealerContext => {
  const dealer = ctx.switchToHttp().getRequest().dealer as DealerContext | undefined;
  if (!dealer) throw Errors.forbidden('NOT_A_DEALER', 'This action requires a dealership account');
  return dealer;
});

@Injectable()
export class DealerAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(userId: string): Promise<DealerContext | null> {
    const member = await this.prisma.dealerMember.findUnique({
      where: { userId },
      include: { dealer: { select: { id: true, status: true } } },
    });
    if (!member || member.status !== DealerMemberStatus.ACTIVE) return null;
    return {
      userId,
      memberId: member.id,
      dealerId: member.dealerId,
      dealerStatus: member.dealer.status,
      role: member.role,
      branchId: member.branchId,
      permissions: effectivePermissions(member.role, member.extraPermissions),
      wideScope: hasDealershipWideScope(member.role) || !member.branchId,
    };
  }

  /** Prisma `where` fragment restricting branch-scoped members to their branch. */
  static branchScope(ctx: DealerContext): { branchId?: string } {
    return ctx.wideScope || !ctx.branchId ? {} : { branchId: ctx.branchId };
  }

  static require(ctx: DealerContext, permission: DealerPermission): void {
    if (!ctx.permissions.includes(permission)) {
      throw Errors.forbidden('MISSING_DEALER_PERMISSION', `Missing permission ${permission}`);
    }
  }
}

@Injectable()
export class DealerAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: DealerAccessService,
    private readonly cls: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<DealerAccessOptions | undefined>(DEALER_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!options) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;
    if (!user) throw Errors.unauthorized();

    const dealer = await this.access.resolve(user.id);
    if (!dealer) throw Errors.forbidden('NOT_A_DEALER', 'This action requires an active dealership membership');

    const inactive = dealer.dealerStatus === DealerStatus.SUSPENDED || dealer.dealerStatus === DealerStatus.REJECTED;
    if (inactive && !options.allowInactive) {
      throw Errors.forbidden('DEALER_INACTIVE', `Dealership is ${dealer.dealerStatus.toLowerCase()}`);
    }
    if (options.requireApproved && dealer.dealerStatus !== DealerStatus.APPROVED) {
      throw Errors.forbidden('DEALER_NOT_APPROVED', 'Your dealership must be approved before you can do this');
    }
    const missing = (options.permissions ?? []).filter((permission) => !dealer.permissions.includes(permission));
    if (missing.length) throw Errors.forbidden('MISSING_DEALER_PERMISSION', `Missing permission ${missing.join(', ')}`);
    if (options.anyPermission?.length && !options.anyPermission.some((permission) => dealer.permissions.includes(permission))) {
      throw Errors.forbidden('MISSING_DEALER_PERMISSION', `Requires one of ${options.anyPermission.join(', ')}`);
    }

    request.dealer = dealer;
    if (this.cls.isActive()) this.cls.set('dealer', dealer);
    return true;
  }
}

@Global()
@Module({ providers: [DealerAccessService, DealerAccessGuard], exports: [DealerAccessService, DealerAccessGuard] })
export class DealerAccessModule {}
