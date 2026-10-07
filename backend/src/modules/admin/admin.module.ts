import { Body, Controller, Get, Injectable, Module, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEmail, IsEnum, IsIn, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import {
  BiddingStatus,
  OutboxStatus,
  Prisma,
  UserRole,
  UserStatus,
  VehicleStatus,
} from '../../generated/prisma/client';
import { CurrentUser, Roles } from '../../common/decorators/auth.decorators';
import { pageArgs, PaginationQueryDto, toPage } from '../../common/dto/pagination.dto';
import { Errors } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/types/auth-user';
import { randomToken, sha256 } from '../../common/utils/strings';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { AuthModule } from '../auth/auth.module';
import { AuthService, toPublicUser } from '../auth/auth.service';

export class AdminUserQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: UserRole }) @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @ApiPropertyOptional({ enum: UserStatus }) @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) q?: string;
}

export class UserStatusDto {
  @ApiProperty({ enum: [UserStatus.ACTIVE, UserStatus.SUSPENDED] }) @IsIn([UserStatus.ACTIVE, UserStatus.SUSPENDED]) status: UserStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

export class UserRoleDto {
  @ApiProperty({ enum: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN] })
  @IsIn([UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN])
  role: UserRole;
}

export class CreateAdminDto {
  @ApiProperty() @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value)) @IsEmail() email: string;
  @ApiProperty() @IsString() @Length(1, 80) firstName: string;
  @ApiProperty() @IsString() @Length(1, 80) lastName: string;
  @ApiProperty({ enum: [UserRole.ADMIN, UserRole.SUPER_ADMIN] }) @IsIn([UserRole.ADMIN, UserRole.SUPER_ADMIN]) role: UserRole;
}

export class AuditQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) entityType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) entityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() actorId?: string;
  @ApiPropertyOptional({ description: 'Action prefix, e.g. "vehicle." or "offer.accept"' }) @IsOptional() @IsString() @MaxLength(80) action?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
}

export class OutboxQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OutboxStatus, default: OutboxStatus.DEAD }) @IsOptional() @IsEnum(OutboxStatus) status?: OutboxStatus;
}

const INVITE_TTL_DAYS = 7;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
    private readonly outbox: OutboxService,
  ) {}

  // ───────────── users (FR-34 manage users) ─────────────

  async users(query: AdminUserQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { email: { contains: query.q.toLowerCase() } },
              { firstName: { contains: query.q, mode: 'insensitive' } },
              { lastName: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        omit: { passwordHash: true },
        include: { dealerMember: { select: { role: true, dealer: { select: { id: true, name: true } } } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    return toPage(rows, total, page, pageSize);
  }

  async user(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { passwordHash: true },
      include: {
        dealerMember: { include: { dealer: { select: { id: true, name: true, status: true } } } },
        _count: { select: { enquiries: true, sellRequests: true, favourites: true, savedSearches: true } },
      },
    });
    if (!user) throw Errors.notFound('User');
    const sessions = await this.prisma.session.count({ where: { userId: id, revokedAt: null, expiresAt: { gt: new Date() } } });
    return { ...user, activeSessions: sessions };
  }

  private assertCanManage(actor: AuthUser, target: { id: string; role: UserRole }) {
    if (actor.id === target.id) throw Errors.forbidden('SELF_MANAGEMENT', 'You cannot change your own account here');
    if ((target.role === UserRole.ADMIN || target.role === UserRole.SUPER_ADMIN) && actor.role !== UserRole.SUPER_ADMIN) {
      throw Errors.forbidden('SUPER_ADMIN_REQUIRED', 'Only a super admin can manage administrators');
    }
  }

  async setStatus(actor: AuthUser, id: string, dto: UserStatusDto) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.status === UserStatus.DELETED) throw Errors.notFound('User');
    this.assertCanManage(actor, target);
    return this.prisma.$transaction(async (tx) => {
      const after = await tx.user.update({ where: { id }, data: { status: dto.status }, omit: { passwordHash: true } });
      if (dto.status === UserStatus.SUSPENDED) await this.auth.logoutAll(id, tx);
      await this.audit.record({ action: 'admin.user_status', entityType: 'user', entityId: id, before: { status: target.status }, after: { status: dto.status, reason: dto.reason } }, tx);
      return after;
    });
  }

  async setRole(actor: AuthUser, id: string, dto: UserRoleDto) {
    const target = await this.prisma.user.findUnique({ where: { id }, include: { dealerMember: true } });
    if (!target || target.status === UserStatus.DELETED) throw Errors.notFound('User');
    this.assertCanManage(actor, target);
    if (target.dealerMember) throw Errors.conflict('DEALER_MEMBER', 'Dealer staff roles are managed by their dealership');
    return this.prisma.$transaction(async (tx) => {
      const after = await tx.user.update({ where: { id }, data: { role: dto.role }, omit: { passwordHash: true } });
      await this.auth.logoutAll(id, tx); // new role takes effect on next sign-in
      await this.audit.record({ action: 'admin.user_role', entityType: 'user', entityId: id, before: { role: target.role }, after: { role: dto.role } }, tx);
      return after;
    });
  }

  /** Super admins invite administrators; they set their own password via the emailed link. */
  async createAdmin(dto: CreateAdminDto) {
    const token = randomToken();
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await this.auth.createUser(tx, { email: dto.email, password: randomToken(24) + 'a1', firstName: dto.firstName, lastName: dto.lastName, role: dto.role });
      await tx.passwordResetToken.create({ data: { userId: created.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000) } });
      await this.outbox.enqueue(tx, {
        type: OutboxEvents.PasswordResetRequested,
        aggregateType: 'user',
        aggregateId: created.id,
        payload: { userId: created.id, token, ttlMinutes: INVITE_TTL_DAYS * 24 * 60 },
      });
      await this.audit.record({ action: 'admin.create_admin', entityType: 'user', entityId: created.id, after: { email: created.email, role: created.role } }, tx);
      return created;
    });
    return toPublicUser(user);
  }

  // ───────────── statistics (FR-34 view platform statistics) ─────────────

  async stats() {
    const since30 = new Date(Date.now() - 30 * 86_400_000);
    const [users, dealers, vehicles, enquiries, sellRequests, liveBidding, deals, newListings, topMakes, newUsers] = await Promise.all([
      this.prisma.user.groupBy({ by: ['role'], where: { status: { not: UserStatus.DELETED } }, _count: { _all: true } }),
      this.prisma.dealer.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.vehicle.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.enquiry.groupBy({ by: ['type'], where: { createdAt: { gte: since30 } }, _count: { _all: true } }),
      this.prisma.sellRequest.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.biddingSession.count({ where: { status: BiddingStatus.OPEN } }),
      this.prisma.deal.aggregate({ where: { createdAt: { gte: since30 } }, _count: true, _sum: { amount: true } }),
      this.prisma.$queryRaw<{ day: Date; count: bigint }[]>(Prisma.sql`
        SELECT date_trunc('day', "publishedAt") AS day, count(*) AS count
          FROM vehicles WHERE "publishedAt" >= ${since30}
         GROUP BY 1 ORDER BY 1`),
      this.prisma.vehicle.groupBy({
        by: ['makeId'],
        where: { status: { in: [VehicleStatus.PUBLISHED, VehicleStatus.RESERVED] } },
        _count: { _all: true },
        orderBy: { _count: { makeId: 'desc' } },
        take: 10,
      }),
      this.prisma.user.count({ where: { createdAt: { gte: since30 } } }),
    ]);
    const makes = await this.prisma.make.findMany({ where: { id: { in: topMakes.map((row) => row.makeId) } }, select: { id: true, name: true } });
    const stockValue = await this.prisma.vehicle.aggregate({ where: { status: VehicleStatus.PUBLISHED }, _sum: { price: true } });
    const grouped = <T extends string>(rows: { _count: { _all: number } }[], key: string) =>
      Object.fromEntries(rows.map((row) => [(row as unknown as Record<string, T>)[key], row._count._all]));

    return {
      users: { byRole: grouped(users, 'role'), newLast30Days: newUsers },
      dealers: grouped(dealers, 'status'),
      vehicles: { byStatus: grouped(vehicles, 'status'), publishedStockValue: stockValue._sum.price ?? 0 },
      enquiriesLast30Days: grouped(enquiries, 'type'),
      sellRequests: grouped(sellRequests, 'status'),
      bidding: { openSessions: liveBidding, dealsLast30Days: deals._count, dealValueLast30Days: deals._sum.amount ?? 0 },
      newListingsPerDay: newListings.map((row) => ({ day: row.day, count: Number(row.count) })),
      topMakes: topMakes.map((row) => ({ make: makes.find((make) => make.id === row.makeId)?.name, listings: row._count._all })),
    };
  }

  // ───────────── audit (BR-13, NFR-15) ─────────────

  async auditLogs(query: AuditQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where: Prisma.AuditLogWhereInput = {
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.action ? { action: { startsWith: query.action } } : {}),
      ...(query.from || query.to
        ? { createdAt: { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: new Date(query.to) } : {}) } }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.auditLog.count({ where }),
    ]);
    return toPage(rows, total, page, pageSize);
  }

  // ───────────── background processing health (NFR-15) ─────────────

  async outboxHealth() {
    const [byStatus, oldestPending] = await Promise.all([
      this.prisma.outboxEvent.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.outboxEvent.findFirst({ where: { status: OutboxStatus.PENDING }, orderBy: { availableAt: 'asc' }, select: { availableAt: true, type: true } }),
    ]);
    return {
      byStatus: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
      oldestPendingAgeSeconds: oldestPending ? Math.max(0, Math.round((Date.now() - oldestPending.availableAt.getTime()) / 1000)) : 0,
      oldestPendingType: oldestPending?.type ?? null,
    };
  }

  async outboxEvents(query: OutboxQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where = { status: query.status ?? OutboxStatus.DEAD };
    const [rows, total] = await Promise.all([
      this.prisma.outboxEvent.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, omit: { payload: true } }),
      this.prisma.outboxEvent.count({ where }),
    ]);
    return toPage(rows, total, page, pageSize);
  }

  async retryOutbox(id: string) {
    const result = await this.prisma.outboxEvent.updateMany({
      where: { id, status: OutboxStatus.DEAD },
      data: { status: OutboxStatus.PENDING, attempts: 0, availableAt: new Date(), lastError: null },
    });
    if (!result.count) throw Errors.conflict('NOT_DEAD', 'Only dead events can be retried');
    await this.audit.record({ action: 'admin.outbox_retry', entityType: 'outbox_event', entityId: id });
    return { retried: true };
  }
}

@ApiTags('Admin: users, statistics, audit, system')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform statistics (FR-34)' })
  stats() {
    return this.admin.stats();
  }

  @Get('users')
  users(@Query() query: AdminUserQueryDto) {
    return this.admin.users(query);
  }

  @Get('users/:id')
  user(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.user(id);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Suspend or reactivate a user (suspension signs them out everywhere)' })
  setStatus(@CurrentUser() actor: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UserStatusDto) {
    return this.admin.setStatus(actor, id, dto);
  }

  @Patch('users/:id/role')
  @Roles(UserRole.SUPER_ADMIN)
  setRole(@CurrentUser() actor: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UserRoleDto) {
    return this.admin.setRole(actor, id, dto);
  }

  @Post('users')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Invite an administrator (super admin only)' })
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.admin.createAdmin(dto);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Audit trail: who did what, when, previous and new values (BR-13)' })
  auditLogs(@Query() query: AuditQueryDto) {
    return this.admin.auditLogs(query);
  }

  @Get('system/outbox')
  @ApiOperation({ summary: 'Background queue health: depth by status and age of the oldest pending event' })
  outboxHealth() {
    return this.admin.outboxHealth();
  }

  @Get('system/outbox/events')
  outboxEvents(@Query() query: OutboxQueryDto) {
    return this.admin.outboxEvents(query);
  }

  @Post('system/outbox/events/:id/retry')
  @ApiOperation({ summary: 'Re-queue a dead-lettered event' })
  retryOutbox(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.retryOutbox(id);
  }
}

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
