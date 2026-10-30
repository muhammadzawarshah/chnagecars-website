import { DealerTradeIdentityService } from '../../infrastructure/dealertrade/dealertrade-identity.service';
import { DealerTradeMediaService } from '../../infrastructure/dealertrade/dealertrade-media.service';
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
import { listingSlugFilter, randomToken, sha256, shortId, slugify } from '../../common/utils/strings';
import { AuditService } from '../../infrastructure/audit/audit.service';
import type { Db } from '../../infrastructure/database';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { WebSyncService } from '../../infrastructure/web-sync/web-sync.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { AuthService } from '../auth/auth.service';
import { PUBLIC_SEARCH_STATUSES } from '../vehicles/vehicle-lifecycle';
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
  onRoadCostsIncluded: true,
  createdAt: true,
  // Map view: the head office first, then any branch with coordinates.
  branches: {
    where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
    orderBy: [{ isHeadOffice: 'desc' }, { createdAt: 'asc' }],
    take: 1,
    select: { latitude: true, longitude: true },
  },
  _count: { select: { vehicles: { where: { status: { in: PUBLIC_SEARCH_STATUSES } } } } },
} satisfies Prisma.DealerSelect;

const LISTED = { status: { in: PUBLIC_SEARCH_STATUSES } } satisfies Prisma.VehicleWhereInput;
/** Pseudo group for dealers that belong to no DealerTrade group. */
const NON_FRANCHISED = { id: 'non-franchised', name: 'Non-Franchised Dealers', slug: 'non-franchised-dealers', logoUrl: null };
const list = (value?: string) => [...new Set((value ?? '').split(',').map(item => item.trim().toLowerCase()).filter(Boolean))];

export type DealerGroup = { id: string; name: string; slug: string; logoUrl: string | null };
/** DealerTrade's dealer groups and concierge flag, read from the stored dealer feed. */
type DealerFeed = { groups: Map<string, DealerGroup[]>; concierge: Set<string>; expiresAt: number };

@Injectable()
export class DealersService {
  private feed?: DealerFeed;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
    private readonly storage: StorageService,
    private readonly webSync: WebSyncService,
    private readonly identities: DealerTradeIdentityService,
    private readonly media: DealerTradeMediaService,
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
    await this.identities.refresh();
    const feed = await this.dealerFeed();
    const { page, pageSize, skip, take } = pageArgs(query);
    const where = this.directoryWhere(query, feed);
    const [data, total] = await Promise.all([
      this.prisma.replica.dealer.findMany({ where, select: publicDealerSelect, orderBy: [{ plan: 'desc' }, { name: 'asc' }], skip, take }),
      this.prisma.replica.dealer.count({ where }),
    ]);
    return toPage(data.map(dealer => this.presentDealer(dealer, feed)), total, page, pageSize);
  }

  /** Every matching dealer with a location, unpaginated, for the map view. */
  async mapPublic(query: PublicDealerQueryDto) {
    const feed = await this.dealerFeed();
    const rows = await this.prisma.replica.dealer.findMany({
      where: { AND: [this.directoryWhere(query, feed), { branches: { some: { isActive: true, latitude: { not: null }, longitude: { not: null } } } }] },
      select: { id: true, name: true, slug: true, logoUrl: true, city: true, province: true, address: true, branches: publicDealerSelect.branches },
      orderBy: { name: 'asc' },
    });
    return rows.map(({ branches, ...dealer }) => ({ ...dealer, latitude: branches[0].latitude!, longitude: branches[0].longitude! }));
  }

  /**
   * The directory lists approved dealers with cars on sale, like changecars.co.za. Filters: name, province,
   * DealerTrade group (or non-franchised), make/model in stock, first letter, motorbikes, concierge, on-road costs.
   */
  private directoryWhere(query: PublicDealerQueryDto, feed: DealerFeed): Prisma.DealerWhereInput {
    const and: Prisma.DealerWhereInput[] = [{ status: DealerStatus.APPROVED }, { vehicles: { some: LISTED } }];
    if (query.province) and.push({ province: query.province });
    if (query.q) and.push({ name: { contains: query.q, mode: 'insensitive' } });
    if (query.letter) {
      and.push(query.letter === '#'
        ? { OR: '0123456789'.split('').map(digit => ({ name: { startsWith: digit } })) }
        : { name: { startsWith: query.letter, mode: 'insensitive' } });
    }
    const groups = list(query.group);
    if (groups.length) {
      const members = [...feed.groups].filter(([, items]) => items.some(item => groups.includes(item.id) || groups.includes(item.slug))).map(([id]) => id);
      const nonFranchised = groups.includes(NON_FRANCHISED.id) || groups.includes(NON_FRANCHISED.slug);
      and.push({ OR: [{ id: { in: members } }, ...(nonFranchised ? [{ id: { notIn: [...feed.groups.keys()] } }] : [])] });
    }
    const makes = list(query.make);
    if (makes.length) and.push({ vehicles: { some: { ...LISTED, make: { slug: { in: makes } } } } });
    const models = list(query.model).map(value => value.split(':')).filter(parts => parts.length === 2);
    if (models.length) and.push({ vehicles: { some: { ...LISTED, OR: models.map(([make, model]) => ({ make: { slug: make }, model: { slug: model } })) } } });
    if (query.motorbike) {
      const bikeGroups = [...feed.groups].filter(([, items]) => items.some(item => /bike/i.test(item.name))).map(([id]) => id);
      and.push({ OR: [{ vehicles: { some: { ...LISTED, categories: { some: { slug: 'motorbikes' } } } } }, { id: { in: bikeGroups } }] });
    }
    if (query.concierge) and.push({ id: { in: [...feed.concierge] } });
    if (query.onRoadCosts) and.push({ onRoadCostsIncluded: true });
    return { AND: and };
  }

  /** Dealer Group dropdown: "All", "Non-Franchised Dealers", then each group, counting directory dealers. */
  async groups() {
    const feed = await this.dealerFeed();
    const dealers = await this.prisma.replica.dealer.findMany({ where: { status: DealerStatus.APPROVED, vehicles: { some: LISTED } }, select: { id: true } });
    const counts = new Map<string, DealerGroup & { dealerCount: number }>();
    let nonFranchised = 0;
    for (const { id } of dealers) {
      const items = feed.groups.get(id);
      if (!items) nonFranchised++;
      for (const item of items ?? []) {
        const group = counts.get(item.id) ?? { ...item, dealerCount: 0 };
        group.dealerCount++;
        counts.set(item.id, group);
      }
    }
    return {
      total: dealers.length,
      groups: [{ ...NON_FRANCHISED, dealerCount: nonFranchised }, ...[...counts.values()].sort((a, b) => a.name.localeCompare(b.name))],
    };
  }

  /** Make/model picker: how many directory dealers have each make and model in stock. */
  async stockMakes() {
    const rows = await this.prisma.replica.vehicle.groupBy({
      by: ['makeId', 'modelId', 'dealerId'],
      where: { ...LISTED, dealer: { status: DealerStatus.APPROVED } },
    });
    const [makes, models] = await Promise.all([
      this.prisma.replica.make.findMany({ where: { id: { in: [...new Set(rows.map(row => row.makeId))] } }, select: { id: true, slug: true, name: true } }),
      this.prisma.replica.model.findMany({ where: { id: { in: [...new Set(rows.map(row => row.modelId))] } }, select: { id: true, slug: true, name: true } }),
    ]);
    const makeById = new Map(makes.map(make => [make.id, make]));
    const modelById = new Map(models.map(model => [model.id, model]));
    const result = new Map<string, { slug: string; name: string; dealers: Set<string>; models: Map<string, { slug: string; value: string; name: string; dealers: Set<string> }> }>();
    for (const row of rows) {
      const make = makeById.get(row.makeId), model = modelById.get(row.modelId);
      if (!make || !model) continue;
      const entry = result.get(make.slug) ?? { slug: make.slug, name: make.name, dealers: new Set<string>(), models: new Map() };
      entry.dealers.add(row.dealerId);
      const modelEntry = entry.models.get(model.slug) ?? { slug: model.slug, value: `${make.slug}:${model.slug}`, name: model.name, dealers: new Set<string>() };
      modelEntry.dealers.add(row.dealerId);
      entry.models.set(model.slug, modelEntry);
      result.set(make.slug, entry);
    }
    const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
    return [...result.values()].sort(byName).map(make => ({
      slug: make.slug, name: make.name, dealerCount: make.dealers.size,
      models: [...make.models.values()].sort(byName).map(({ dealers, ...model }) => ({ ...model, dealerCount: dealers.size })),
    }));
  }

  async getPublic(slug: string) {
    await this.identities.refresh();
    const feed = await this.dealerFeed();
    const dealer = await this.prisma.replica.dealer.findFirst({
      where: { slug: listingSlugFilter(slug), status: DealerStatus.APPROVED },
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
    const { _count, branches, ...rest } = dealer;
    const located = [...branches].sort((a, b) => Number(b.isHeadOffice) - Number(a.isHeadOffice)).filter(branch => branch.latitude !== null && branch.longitude !== null);
    return { ...this.presentDealer({ ...rest, branches: located.slice(0, 1) }, feed), branches, activeListings: _count.vehicles };
  }

  private presentDealer<T extends { id: string; branches: { latitude: number | null; longitude: number | null }[]; _count?: { vehicles: number } }>(dealer: T, feed: DealerFeed) {
    const { branches, _count, ...rest } = dealer;
    return {
      ...rest,
      ...(_count ? { activeListings: _count.vehicles } : {}),
      whatsappNumber: this.identities.whatsappNumber(dealer.id),
      groups: feed.groups.get(dealer.id) ?? [],
      conciergePartner: feed.concierge.has(dealer.id),
      latitude: branches[0]?.latitude ?? null,
      longitude: branches[0]?.longitude ?? null,
    };
  }

  /** Cached for a minute; the DealerTrade sync updates the stored feed. */
  private async dealerFeed(): Promise<DealerFeed> {
    if (this.feed && Date.now() < this.feed.expiresAt) return this.feed;
    const rows = await this.prisma.replica.$queryRaw<{ dealerId: string; groups: unknown; concierge: string | null }[]>`
      SELECT "externalId" AS "dealerId", payload->'dealer_groups' AS groups, payload->>'concierge_partner' AS concierge
      FROM source_feed_records WHERE source = 'dealertrade' AND kind = 'dealer'`;
    const groups = new Map<string, DealerGroup[]>();
    const concierge = new Set<string>();
    for (const row of rows) {
      if (row.concierge === '1' || row.concierge === 'true') concierge.add(row.dealerId);
      const items = (Array.isArray(row.groups) ? row.groups : []).flatMap((item: { id?: unknown; name?: unknown; logo?: unknown }) => {
        const name = typeof item?.name === 'string' ? item.name.trim() : '';
        if (item?.id === undefined || item.id === null || !name) return [];
        const logo = typeof item.logo === 'string' && item.logo.trim() ? this.media.url(item.logo.trim()) : null;
        return [{ id: String(item.id), name, slug: slugify(name), logoUrl: logo }];
      });
      if (items.length) groups.set(row.dealerId, items);
    }
    this.feed = { groups, concierge, expiresAt: Date.now() + 60_000 };
    return this.feed;
  }

  // ───────────── dealer portal: profile ─────────────

  async getOwnProfile(ctx: DealerContext) {
    return this.prisma.dealer.findUniqueOrThrow({
      where: { id: ctx.dealerId },
      include: { branches: { orderBy: { name: 'asc' } } },
    });
  }

  async updateProfile(ctx: Pick<DealerContext, 'dealerId'>, dto: UpdateDealerProfileDto) {
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
