import { Injectable } from '@nestjs/common';
import {
  DealerMemberRole,
  DealerMemberStatus,
  DealerStatus,
  Prisma,
  UserRole,
  VehicleStatus,
} from '../../generated/prisma/client';
import { pageArgs, toPage } from '../../common/dto/pagination.dto';
import { Errors } from '../../common/errors/app-error';
import { randomToken, sha256, shortId, slugify } from '../../common/utils/strings';
import { AuditService } from '../../infrastructure/audit/audit.service';
import type { Db } from '../../infrastructure/database';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { WebSyncService } from '../../infrastructure/web-sync/web-sync.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { AuthService } from '../auth/auth.service';
import { DealerContext } from './dealer-access';
import { effectivePermissions } from './dealer-permissions';
import {
  AdminDealerQueryDto,
  AdminUpdateDealerDto,
  BranchInputDto,
  ChangeDealerStatusDto,
  ConfirmDocumentDto,
  CreateStaffDto,
  DocumentUploadRequestDto,
  PublicDealerQueryDto,
  RegisterDealerDto,
  UpdateBranchDto,
  UpdateDealerProfileDto,
  UpdateStaffDto,
} from './dto/dealer.dto';

/** Allowed admin transitions for a dealership application/account. */
const DEALER_TRANSITIONS: Record<DealerStatus, DealerStatus[]> = {
  PENDING: [DealerStatus.APPROVED, DealerStatus.REJECTED],
  APPROVED: [DealerStatus.SUSPENDED],
  SUSPENDED: [DealerStatus.APPROVED],
  REJECTED: [DealerStatus.APPROVED],
};

const INVITE_TTL_DAYS = 7;

const publicDealerSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  logoUrl: true,
  website: true,
  phone: true,
  email: true,
  province: true,
  city: true,
  address: true,
  rating: true,
  plan: true,
  createdAt: true,
} satisfies Prisma.DealerSelect;

@Injectable()
export class DealersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
    private readonly storage: StorageService,
    private readonly webSync: WebSyncService,
  ) {}

  // ───────────── registration (FR-11) ─────────────

  async register(dto: RegisterDealerDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const owner = await this.auth.createUser(tx, { ...dto.owner, role: UserRole.DEALER });
      const dealer = await tx.dealer.create({
        data: {
          ...dto.dealership,
          slug: await this.uniqueDealerSlug(tx, dto.dealership.name),
          status: DealerStatus.APPROVED,
        },
      });
      const branch = await tx.branch.create({
        data: {
          dealerId: dealer.id,
          name: `${dto.dealership.name} - ${dto.dealership.city}`,
          slug: slugify(dto.dealership.city) || 'head-office',
          email: dto.dealership.email,
          phone: dto.dealership.phone,
          address: dto.dealership.address,
          city: dto.dealership.city,
          province: dto.dealership.province,
          isHeadOffice: true,
          operatingHours: (dto.operatingHours ?? []) as unknown as Prisma.InputJsonValue,
        },
      });
      await tx.dealerMember.create({
        data: { dealerId: dealer.id, userId: owner.id, role: DealerMemberRole.OWNER, branchId: null },
      });
      await this.audit.record({ action: 'dealer.register', entityType: 'dealer', entityId: dealer.id, after: dealer, actorId: owner.id, actorRole: owner.role }, tx);
      await this.outbox.enqueue(tx, {
        type: OutboxEvents.DealerRegistered,
        aggregateType: 'dealer',
        aggregateId: dealer.id,
        payload: { dealerId: dealer.id },
      });
      return { owner, dealer, branch };
    });

    const tokens = await this.auth.issueTokens(result.owner);
    return { ...tokens, dealer: { id: result.dealer.id, name: result.dealer.name, slug: result.dealer.slug, status: result.dealer.status } };
  }

  private async uniqueDealerSlug(db: Db, name: string): Promise<string> {
    const base = slugify(name) || 'dealer';
    const taken = await db.dealer.findUnique({ where: { slug: base }, select: { id: true } });
    return taken ? `${base}-${shortId(4)}` : base;
  }

  // ───────────── public directory ─────────────

  async listPublic(query: PublicDealerQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where: Prisma.DealerWhereInput = {
      status: DealerStatus.APPROVED,
      ...(query.province ? { province: query.province } : {}),
      ...(query.q ? { name: { contains: query.q, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.replica.dealer.findMany({ where, select: publicDealerSelect, orderBy: [{ plan: 'desc' }, { name: 'asc' }], skip, take }),
      this.prisma.replica.dealer.count({ where }),
    ]);
    return toPage(data, total, page, pageSize);
  }

  async getPublic(slug: string) {
    const dealer = await this.prisma.replica.dealer.findFirst({
      where: { slug, status: DealerStatus.APPROVED },
      select: {
        ...publicDealerSelect,
        branches: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true, address: true, city: true, province: true, phone: true, email: true, latitude: true, longitude: true, operatingHours: true, isHeadOffice: true },
        },
        _count: { select: { vehicles: { where: { status: { in: [VehicleStatus.PUBLISHED, VehicleStatus.RESERVED] } } } } },
      },
    });
    if (!dealer) throw Errors.notFound('Dealer');
    const { _count, ...rest } = dealer;
    return { ...rest, activeListings: _count.vehicles };
  }

  // ───────────── dealer portal: profile ─────────────

  async getOwnProfile(ctx: DealerContext) {
    return this.prisma.dealer.findUniqueOrThrow({
      where: { id: ctx.dealerId },
      include: { branches: { orderBy: { name: 'asc' } } },
    });
  }

  async updateProfile(ctx: DealerContext, dto: UpdateDealerProfileDto) {
    const before = await this.prisma.dealer.findUniqueOrThrow({ where: { id: ctx.dealerId } });
    const result = await this.prisma.$transaction(async (tx) => {
      const after = await tx.dealer.update({ where: { id: ctx.dealerId }, data: dto });
      await this.audit.record({ action: 'dealer.profile_update', entityType: 'dealer', entityId: ctx.dealerId, before, after }, tx);
      return after;
    });
    // Dealer name, status, address and hours appear on public car pages.
    this.webSync.changed('cars');
    return result;
  }

  // ───────────── verification documents ─────────────

  async documentUploadUrl(ctx: DealerContext, dto: DocumentUploadRequestDto) {
    const extension = dto.contentType === 'application/pdf' ? 'pdf' : dto.contentType === 'image/png' ? 'png' : 'jpg';
    const storageKey = `private/dealers/${ctx.dealerId}/documents/${shortId(12)}.${extension}`;
    return { storageKey, uploadUrl: await this.storage.presignUpload(storageKey, dto.contentType), expiresIn: 600 };
  }

  async confirmDocument(ctx: DealerContext, dto: ConfirmDocumentDto) {
    if (!dto.storageKey.startsWith(`private/dealers/${ctx.dealerId}/documents/`)) {
      throw Errors.forbidden('INVALID_STORAGE_KEY', 'Storage key does not belong to this dealership');
    }
    const object = await this.storage.head(dto.storageKey);
    if (!object) throw Errors.badRequest('UPLOAD_NOT_FOUND', 'The file has not been uploaded yet');
    if (object.size > 20 * 1024 * 1024) throw Errors.badRequest('FILE_TOO_LARGE', 'Documents may be at most 20 MB');
    const document = await this.prisma.dealerDocument.create({
      data: { dealerId: ctx.dealerId, type: dto.type, fileName: dto.fileName, storageKey: dto.storageKey, contentType: dto.contentType },
    });
    await this.audit.record({ action: 'dealer.document_upload', entityType: 'dealer', entityId: ctx.dealerId, after: { documentId: document.id, type: dto.type } });
    return document;
  }

  listDocuments(dealerId: string) {
    return this.prisma.dealerDocument.findMany({ where: { dealerId }, orderBy: { uploadedAt: 'desc' } });
  }

  // ───────────── branches (FR-46) ─────────────

  listBranches(ctx: DealerContext) {
    return this.prisma.branch.findMany({ where: { dealerId: ctx.dealerId }, orderBy: [{ isHeadOffice: 'desc' }, { name: 'asc' }] });
  }

  async createBranch(ctx: DealerContext, dto: BranchInputDto) {
    const slug = slugify(dto.name);
    const exists = await this.prisma.branch.findUnique({ where: { dealerId_slug: { dealerId: ctx.dealerId, slug } } });
    if (exists) throw Errors.conflict('BRANCH_EXISTS', 'A branch with this name already exists');
    return this.prisma.$transaction(async (tx) => {
      const branch = await tx.branch.create({
        data: { ...dto, slug, dealerId: ctx.dealerId, operatingHours: (dto.operatingHours ?? []) as unknown as Prisma.InputJsonValue },
      });
      await this.audit.record({ action: 'branch.create', entityType: 'branch', entityId: branch.id, after: branch }, tx);
      return branch;
    });
  }

  async updateBranch(ctx: DealerContext, branchId: string, dto: UpdateBranchDto) {
    const before = await this.ownBranch(ctx.dealerId, branchId);
    if (dto.isActive === false && before.isHeadOffice) {
      throw Errors.badRequest('HEAD_OFFICE_REQUIRED', 'The head-office branch cannot be deactivated');
    }
    const { operatingHours, ...fields } = dto;
    const result = await this.prisma.$transaction(async (tx) => {
      const after = await tx.branch.update({
        where: { id: branchId },
        data: {
          ...fields,
          ...(dto.name ? { slug: slugify(dto.name) } : {}),
          ...(operatingHours ? { operatingHours: operatingHours as unknown as Prisma.InputJsonValue } : {}),
        },
      });
      await this.audit.record({ action: 'branch.update', entityType: 'branch', entityId: branchId, before, after }, tx);
      return after;
    });
    // Dealer name, status, address and hours appear on public car pages.
    this.webSync.changed('cars');
    return result;
  }

  async ownBranch(dealerId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, dealerId } });
    if (!branch) throw Errors.notFound('Branch');
    return branch;
  }

  // ───────────── staff (FR-45) ─────────────

  async listStaff(ctx: DealerContext) {
    const members = await this.prisma.dealerMember.findMany({
      where: { dealerId: ctx.dealerId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, lastLoginAt: true } },
        branch: { select: { id: true, name: true } },
        _count: { select: { assignedLeads: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return members.map(({ _count, ...member }) => ({
      ...member,
      permissions: effectivePermissions(member.role, member.extraPermissions),
      assignedLeads: _count.assignedLeads,
    }));
  }

  /** Creates the staff user and emails a set-password invitation link. */
  async createStaff(ctx: DealerContext, dto: CreateStaffDto) {
    this.assertCanManageRole(ctx, dto.role);
    if (dto.branchId) await this.ownBranch(ctx.dealerId, dto.branchId);
    this.assertGrantable(ctx, dto.extraPermissions ?? []);

    const inviteToken = randomToken();
    const member = await this.prisma.$transaction(async (tx) => {
      const user = await this.auth.createUser(tx, {
        email: dto.email,
        password: randomToken(24) + 'a1',
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: UserRole.DEALER,
      });
      const created = await tx.dealerMember.create({
        data: {
          dealerId: ctx.dealerId,
          userId: user.id,
          branchId: dto.branchId ?? null,
          role: dto.role,
          extraPermissions: dto.extraPermissions ?? [],
          invitedById: ctx.userId,
          status: DealerMemberStatus.ACTIVE,
        },
      });
      await tx.passwordResetToken.create({
        data: { userId: user.id, tokenHash: sha256(inviteToken), expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000) },
      });
      await this.outbox.enqueue(tx, {
        type: OutboxEvents.DealerMemberInvited,
        aggregateType: 'dealer',
        aggregateId: ctx.dealerId,
        payload: { memberId: created.id, userId: user.id, dealerId: ctx.dealerId, token: inviteToken },
      });
      await this.audit.record({ action: 'dealer.staff_create', entityType: 'dealer_member', entityId: created.id, after: created }, tx);
      return created;
    });
    return member;
  }

  async updateStaff(ctx: DealerContext, memberId: string, dto: UpdateStaffDto) {
    const before = await this.prisma.dealerMember.findFirst({ where: { id: memberId, dealerId: ctx.dealerId } });
    if (!before) throw Errors.notFound('Staff member');
    if (before.role === DealerMemberRole.OWNER) throw Errors.forbidden('OWNER_IMMUTABLE', 'The dealership owner cannot be changed here');
    if (before.id === ctx.memberId) throw Errors.forbidden('SELF_UPDATE', 'You cannot change your own role or access');
    this.assertCanManageRole(ctx, before.role);
    if (dto.role) this.assertCanManageRole(ctx, dto.role);
    if (dto.extraPermissions) this.assertGrantable(ctx, dto.extraPermissions);
    if (dto.branchId) await this.ownBranch(ctx.dealerId, dto.branchId);

    return this.prisma.$transaction(async (tx) => {
      const after = await tx.dealerMember.update({ where: { id: memberId }, data: dto });
      if (dto.status === DealerMemberStatus.DISABLED) {
        await this.auth.logoutAll(before.userId, tx);
      }
      await this.audit.record({ action: 'dealer.staff_update', entityType: 'dealer_member', entityId: memberId, before, after }, tx);
      return after;
    });
  }

  /** FR-45 "view staff activity": audit trail + CRM activity for one member. */
  async staffActivity(ctx: DealerContext, memberId: string, query: { page?: number; pageSize?: number }) {
    const member = await this.prisma.dealerMember.findFirst({ where: { id: memberId, dealerId: ctx.dealerId } });
    if (!member) throw Errors.notFound('Staff member');
    const { page, pageSize, skip, take } = pageArgs(query);
    const where: Prisma.AuditLogWhereInput = { actorId: member.userId };
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: { id: true, action: true, entityType: true, entityId: true, createdAt: true },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return toPage(data, total, page, pageSize);
  }

  private assertCanManageRole(ctx: DealerContext, role: DealerMemberRole) {
    if (role === DealerMemberRole.OWNER) throw Errors.forbidden('OWNER_IMMUTABLE', 'Owners cannot be created or modified');
    if (role === DealerMemberRole.MANAGER && ctx.role !== DealerMemberRole.OWNER) {
      throw Errors.forbidden('INSUFFICIENT_ROLE', 'Only the owner can manage managers');
    }
  }

  /** Nobody can grant permissions they do not hold themselves. */
  private assertGrantable(ctx: DealerContext, permissions: string[]) {
    const missing = permissions.filter((permission) => !ctx.permissions.includes(permission as never));
    if (missing.length) throw Errors.forbidden('CANNOT_GRANT', `You cannot grant permissions you do not have: ${missing.join(', ')}`);
  }

  // ───────────── administration (FR-34) ─────────────

  async adminList(query: AdminDealerQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where: Prisma.DealerWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.province ? { province: query.province } : {}),
      ...(query.q
        ? { OR: [{ name: { contains: query.q, mode: 'insensitive' } }, { email: { contains: query.q, mode: 'insensitive' } }] }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.dealer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { _count: { select: { vehicles: true, members: true, branches: true, leads: true } } },
      }),
      this.prisma.dealer.count({ where }),
    ]);
    return toPage(rows, total, page, pageSize);
  }

  async adminGet(id: string) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id },
      include: {
        branches: true,
        members: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true, lastLoginAt: true } } } },
        documents: true,
      },
    });
    if (!dealer) throw Errors.notFound('Dealer');
    const [vehiclesByStatus, leadsByStage] = await Promise.all([
      this.prisma.vehicle.groupBy({ by: ['status'], where: { dealerId: id }, _count: true }),
      this.prisma.lead.groupBy({ by: ['stage'], where: { dealerId: id }, _count: true }),
    ]);
    const documents = await Promise.all(
      dealer.documents.map(async (doc) => ({ ...doc, downloadUrl: await this.storage.presignDownload(doc.storageKey) })),
    );
    return {
      ...dealer,
      documents,
      stats: {
        vehiclesByStatus: Object.fromEntries(vehiclesByStatus.map((row) => [row.status, row._count])),
        leadsByStage: Object.fromEntries(leadsByStage.map((row) => [row.stage, row._count])),
      },
    };
  }

  async changeStatus(id: string, dto: ChangeDealerStatusDto, adminId: string) {
    const before = await this.prisma.dealer.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Dealer');
    if (!DEALER_TRANSITIONS[before.status].includes(dto.status)) {
      throw Errors.conflict('INVALID_STATUS_TRANSITION', `Cannot change dealer from ${before.status} to ${dto.status}`, {
        allowed: DEALER_TRANSITIONS[before.status],
      });
    }
    if ((dto.status === DealerStatus.REJECTED || dto.status === DealerStatus.SUSPENDED) && !dto.reason) {
      throw Errors.badRequest('REASON_REQUIRED', 'A reason is required when rejecting or suspending a dealer');
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const after = await tx.dealer.update({
        where: { id, status: before.status },
        data: {
          status: dto.status,
          ...(dto.status === DealerStatus.APPROVED ? { approvedAt: new Date(), approvedById: adminId, rejectionReason: null, suspensionReason: null } : {}),
          ...(dto.status === DealerStatus.REJECTED ? { rejectionReason: dto.reason } : {}),
          ...(dto.status === DealerStatus.SUSPENDED ? { suspensionReason: dto.reason } : {}),
        },
      });
      await this.audit.record({ action: 'dealer.status_change', entityType: 'dealer', entityId: id, before: { status: before.status }, after: { status: after.status, reason: dto.reason } }, tx);
      await this.outbox.enqueue(tx, {
        type: OutboxEvents.DealerStatusChanged,
        aggregateType: 'dealer',
        aggregateId: id,
        payload: { dealerId: id, from: before.status, to: dto.status, reason: dto.reason ?? null },
      });
      return after;
    });
    // Dealer name, status, address and hours appear on public car pages.
    this.webSync.changed('cars');
    return result;
  }

  async adminUpdate(id: string, dto: AdminUpdateDealerDto) {
    const before = await this.prisma.dealer.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Dealer');
    const result = await this.prisma.$transaction(async (tx) => {
      const after = await tx.dealer.update({ where: { id }, data: dto });
      await this.audit.record({ action: 'dealer.admin_update', entityType: 'dealer', entityId: id, before, after }, tx);
      return after;
    });
    // Dealer name, status, address and hours appear on public car pages.
    this.webSync.changed('cars');
    return result;
  }
}
