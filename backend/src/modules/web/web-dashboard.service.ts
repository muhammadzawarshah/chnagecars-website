import { Injectable } from '@nestjs/common';
import { DealerMemberRole, DealerStatus, LeadStage, Prisma, UserRole, UserStatus, VehicleStatus } from '../../generated/prisma/client';
import { Errors } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { DealerAccessService, DealerContext } from '../dealers/dealer-access';
import { DealersService } from '../dealers/dealers.service';
import { PUBLIC_SEARCH_STATUSES } from '../vehicles/vehicle-lifecycle';
import {
  DEALER_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  LISTING_STATUS_LABELS,
  PLAN_LABELS,
  PROVINCE_NAMES,
  WebDealerStatus,
  isUuid,
  localPhone,
  ymd,
  ymdhm,
} from './web-format';

const DAY = 86_400_000;
const RECENT_DAYS = 30;
const CONVERSION_DAYS = 90;
const SELL_SPEED_DAYS = 180;
const MONTHS = 6;
const MAX_ROWS = 500;
const ADMIN_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

type MonthlyPoint = { month: string; value: number };

/** Last six calendar months including the current one, oldest first: keys "2026-05" and labels "May". */
function monthWindow(now = new Date()) {
  return Array.from({ length: MONTHS }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS - 1 - index), 1));
    return { key: date.toISOString().slice(0, 7), label: date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }) };
  });
}

const dealerFilter = (column: string, ids: string[] | null) =>
  ids ? Prisma.sql`AND ${Prisma.raw(column)} IN (${Prisma.join(ids.map((id) => Prisma.sql`${id}::uuid`))})` : Prisma.empty;

const round1 = (value: number) => Math.round(value * 10) / 10;

export type WebDealerStats = {
  activeListings: number;
  soldThisMonth: number;
  views: number;
  leads: number;
  conversionRate: number;
  avgDaysToSell: number;
  stockValue: number;
  responseHours: number;
  monthlyLeads: MonthlyPoint[];
  monthlyViews: MonthlyPoint[];
  monthlySold: MonthlyPoint[];
};

/** Who is asking, resolved once per request. */
type Viewer = { user: AuthUser; isAdmin: boolean; dealer: DealerContext | null };

const AUDIT_TEXT: Record<string, (after: Record<string, unknown>) => string | null> = {
  'dealer.register': () => 'received a dealer application from',
  'dealer.status_change': (after) =>
    after.status === DealerStatus.APPROVED ? 'approved' : after.status === DealerStatus.SUSPENDED ? 'suspended' : after.status === DealerStatus.REJECTED ? 'rejected' : null,
  'dealer.admin_update': (after) => (typeof after.plan === 'string' ? `changed the plan to ${PLAN_LABELS[after.plan as keyof typeof PLAN_LABELS] ?? after.plan} for` : 'updated'),
  'vehicle.approve': () => 'approved a listing from',
  'vehicle.reject': () => 'rejected a listing from',
  'vehicle.suspend': () => 'flagged a listing from',
  'vehicle.unsuspend': () => 'restored a listing from',
  'vehicle.admin_flags': () => 'updated listing flags for',
};

@Injectable()
export class WebDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: DealerAccessService,
    private readonly dealers: DealersService,
  ) {}

  // ───────────── access ─────────────

  async viewer(user: AuthUser): Promise<Viewer> {
    const isAdmin = ADMIN_ROLES.includes(user.role);
    return { user, isAdmin, dealer: isAdmin ? null : await this.access.resolve(user.id) };
  }

  private requireAdmin(viewer: Viewer) {
    if (!viewer.isAdmin) throw Errors.forbidden();
  }

  /** Admins may open any dealer; dealer staff only their own dealership. */
  private dealerScope(viewer: Viewer, dealerId?: string): string | null {
    if (viewer.isAdmin) {
      if (dealerId && !isUuid(dealerId)) throw Errors.notFound('Dealer');
      return dealerId ?? null;
    }
    if (!viewer.dealer) throw Errors.forbidden('NOT_A_DEALER', 'This account is not linked to a dealership');
    if (dealerId && dealerId !== viewer.dealer.dealerId) throw Errors.forbidden();
    return viewer.dealer.dealerId;
  }

  /** Branch-scoped dealer staff only see their branch's stock and leads. */
  private branchScope(viewer: Viewer): { branchId?: string } {
    return viewer.dealer ? DealerAccessService.branchScope(viewer.dealer) : {};
  }

  // ───────────── dealers ─────────────

  async dealersList(viewer: Viewer) {
    this.requireAdmin(viewer);
    const rows = await this.prisma.dealer.findMany({ select: dealerSelect, orderBy: [{ createdAt: 'asc' }] });
    return this.withStats(rows);
  }

  async dealersById(viewer: Viewer, ids: string[]) {
    this.requireAdmin(viewer);
    const wanted = [...new Set(ids.filter(isUuid))].slice(0, 4);
    if (!wanted.length) return [];
    const rows = await this.prisma.dealer.findMany({ where: { id: { in: wanted } }, select: dealerSelect });
    const summaries = await this.withStats(rows);
    return wanted.map((id) => summaries.find((dealer) => dealer.id === id)).filter((dealer) => !!dealer);
  }

  async dealer(viewer: Viewer, id: string) {
    const dealerId = this.dealerScope(viewer, id);
    const row = dealerId ? await this.prisma.dealer.findUnique({ where: { id: dealerId }, select: dealerSelect }) : null;
    if (!row) throw Errors.notFound('Dealer');
    return (await this.withStats([row]))[0];
  }

  /** The console's Approve / Suspend / Reactivate buttons. */
  async setDealerStatus(viewer: Viewer, id: string, status: WebDealerStatus) {
    this.requireAdmin(viewer);
    if (!isUuid(id)) throw Errors.notFound('Dealer');
    if (status === 'pending') throw Errors.badRequest('INVALID_STATUS', 'A dealer cannot be moved back to pending');
    const target = status === 'active' ? DealerStatus.APPROVED : DealerStatus.SUSPENDED;
    const reason = target === DealerStatus.SUSPENDED ? 'Suspended from the admin console' : undefined;
    await this.dealers.changeStatus(id, { status: target, reason }, viewer.user.id);
    return { ok: true };
  }

  // ───────────── inventory and leads ─────────────

  async inventory(viewer: Viewer, dealerId?: string) {
    const scope = this.dealerScope(viewer, dealerId);
    const rows = await this.prisma.vehicle.findMany({
      where: { ...(scope ? { dealerId: scope } : {}), ...this.branchScope(viewer), status: { not: VehicleStatus.ARCHIVED } },
      select: {
        id: true,
        dealerId: true,
        title: true,
        primaryImageUrl: true,
        price: true,
        mileage: true,
        status: true,
        viewCount: true,
        publishedAt: true,
        createdAt: true,
        _count: { select: { leads: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: MAX_ROWS,
    });
    return rows.map((row) => ({
      id: row.id,
      dealerId: row.dealerId,
      title: row.title,
      image: row.primaryImageUrl ?? '/img/success-car.png',
      price: row.price,
      mileage: row.mileage ?? -1,
      status: LISTING_STATUS_LABELS[row.status],
      views: row.viewCount,
      leads: row._count.leads,
      listedAt: ymd(row.publishedAt ?? row.createdAt),
    }));
  }

  async leads(viewer: Viewer, dealerId?: string) {
    const scope = this.dealerScope(viewer, dealerId);
    const rows = await this.prisma.lead.findMany({
      where: { ...(scope ? { dealerId: scope } : {}), ...this.branchScope(viewer) },
      select: {
        id: true,
        dealerId: true,
        name: true,
        phone: true,
        source: true,
        stage: true,
        createdAt: true,
        vehicle: { select: { title: true } },
        enquiry: { select: { type: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: MAX_ROWS,
    });
    return rows.map((row) => ({
      id: row.id,
      dealerId: row.dealerId,
      customer: row.name,
      phone: localPhone(row.phone),
      vehicle: row.vehicle?.title ?? (row.enquiry ? `${row.enquiry.type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())} enquiry` : 'General enquiry'),
      source: LEAD_SOURCE_LABELS[row.source],
      status: LEAD_STATUS_LABELS[row.stage],
      createdAt: ymdhm(row.createdAt),
    }));
  }

  // ───────────── console ─────────────

  async staff(viewer: Viewer) {
    if (viewer.user.role !== UserRole.SUPER_ADMIN) throw Errors.forbidden();
    const users = await this.prisma.user.findMany({
      where: { role: { in: ADMIN_ROLES }, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true, lastLoginAt: true },
      orderBy: [{ role: 'desc' }, { firstName: 'asc' }],
    });
    return users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role === UserRole.SUPER_ADMIN ? 'super-admin' : 'admin',
      status: user.status !== UserStatus.ACTIVE ? 'disabled' : user.lastLoginAt ? 'active' : 'invited',
      lastActive: ymdhm(user.lastLoginAt),
    }));
  }

  /** Recent platform events from the audit log, in the console's "actor action target" form. */
  async activity(viewer: Viewer) {
    this.requireAdmin(viewer);
    const logs = await this.prisma.auditLog.findMany({
      where: { action: { in: Object.keys(AUDIT_TEXT) } },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });
    const actorIds = [...new Set(logs.map((log) => log.actorId).filter((id): id is string => !!id))];
    const vehicleIds = logs.filter((log) => log.entityType === 'vehicle' && log.entityId).map((log) => log.entityId!);
    const [actors, vehicles] = await Promise.all([
      this.prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, firstName: true, lastName: true, role: true } }),
      this.prisma.vehicle.findMany({ where: { id: { in: vehicleIds } }, select: { id: true, dealerId: true } }),
    ]);
    const dealerIds = [
      ...new Set([...logs.filter((log) => log.entityType === 'dealer' && log.entityId).map((log) => log.entityId!), ...vehicles.map((vehicle) => vehicle.dealerId)]),
    ];
    const dealers = await this.prisma.dealer.findMany({ where: { id: { in: dealerIds } }, select: { id: true, name: true } });

    const items = logs.flatMap((log) => {
      const after = (log.after && typeof log.after === 'object' ? log.after : {}) as Record<string, unknown>;
      const action = AUDIT_TEXT[log.action]?.(after);
      if (!action) return [];
      const dealerId = log.entityType === 'dealer' ? log.entityId : vehicles.find((vehicle) => vehicle.id === log.entityId)?.dealerId;
      const target = dealers.find((dealer) => dealer.id === dealerId)?.name;
      if (!target) return [];
      const actor = actors.find((user) => user.id === log.actorId);
      const isSystem = log.action === 'dealer.register' || !actor || !ADMIN_ROLES.includes(actor.role);
      return [{ id: log.id, actor: isSystem ? 'System' : `${actor.firstName} ${actor.lastName}`.trim(), action, target, at: ymdhm(log.createdAt) }];
    });
    return items.slice(0, 8);
  }

  async overview(viewer: Viewer) {
    this.requireAdmin(viewer);
    const since = new Date(Date.now() - RECENT_DAYS * DAY);
    const months = monthWindow();
    const start = new Date(`${months[0].key}-01T00:00:00Z`);
    const [byStatus, listings, views, sold, leads, leadMonths, soldMonths] = await Promise.all([
      this.prisma.dealer.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.vehicle.aggregate({ where: { status: { in: PUBLIC_SEARCH_STATUSES } }, _count: { _all: true }, _sum: { price: true } }),
      this.prisma.vehicle.aggregate({ _sum: { viewCount: true } }),
      this.prisma.vehicle.count({ where: { soldAt: { gte: since } } }),
      this.prisma.lead.count({ where: { createdAt: { gte: since } } }),
      this.prisma.$queryRaw<{ m: string; n: number }[]>(Prisma.sql`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS m, count(*)::int AS n
          FROM leads WHERE "createdAt" >= ${start} GROUP BY 1`),
      this.prisma.$queryRaw<{ m: string; n: number }[]>(Prisma.sql`
        SELECT to_char(date_trunc('month', "soldAt"), 'YYYY-MM') AS m, count(*)::int AS n
          FROM vehicles WHERE "soldAt" >= ${start} GROUP BY 1`),
    ]);
    const count = (status: DealerStatus) => byStatus.find((row) => row.status === status)?._count._all ?? 0;
    const series = (rows: { m: string; n: number }[]) => months.map((month) => ({ month: month.label, value: rows.find((row) => row.m === month.key)?.n ?? 0 }));
    return {
      dealers: byStatus.reduce((sum, row) => sum + row._count._all, 0),
      activeDealers: count(DealerStatus.APPROVED),
      pendingDealers: count(DealerStatus.PENDING),
      activeListings: listings._count._all,
      leads,
      views: views._sum.viewCount ?? 0,
      soldThisMonth: sold,
      stockValue: listings._sum.price ?? 0,
      monthlyLeads: series(leadMonths),
      monthlySold: series(soldMonths),
    };
  }

  // ───────────── stats ─────────────

  private async withStats(rows: DealerRow[]) {
    const stats = await this.stats(rows.map((row) => row.id));
    return rows.map((row) => {
      const owner = row.members.find((member) => member.role === DealerMemberRole.OWNER) ?? row.members[0];
      return {
        id: row.id,
        name: row.name,
        contactName: owner ? `${owner.user.firstName} ${owner.user.lastName}`.trim() : '',
        email: row.email,
        phone: localPhone(row.phone),
        city: row.city,
        province: PROVINCE_NAMES[row.province],
        plan: PLAN_LABELS[row.plan],
        status: DEALER_STATUS_LABELS[row.status],
        joinedAt: ymd(row.createdAt),
        rating: row.rating ?? 0,
        stats: stats.get(row.id) ?? emptyStats(),
      };
    });
  }

  /** Every dashboard number for a set of dealers, in a fixed number of grouped queries. */
  private async stats(ids: string[]): Promise<Map<string, WebDealerStats>> {
    const result = new Map<string, WebDealerStats>(ids.map((id) => [id, emptyStats()]));
    if (!ids.length) return result;
    const now = Date.now();
    const recent = new Date(now - RECENT_DAYS * DAY);
    const conversionSince = new Date(now - CONVERSION_DAYS * DAY);
    const sellSince = new Date(now - SELL_SPEED_DAYS * DAY);
    const months = monthWindow();
    const start = new Date(`${months[0].key}-01T00:00:00Z`);
    const inDealers = { dealerId: { in: ids } };

    const [listings, views, sold, leads, outcomes, speed, response, leadMonths, soldMonths, viewMonths] = await Promise.all([
      this.prisma.vehicle.groupBy({ by: ['dealerId'], where: { ...inDealers, status: { in: PUBLIC_SEARCH_STATUSES } }, _count: { _all: true }, _sum: { price: true } }),
      this.prisma.vehicle.groupBy({ by: ['dealerId'], where: inDealers, _sum: { viewCount: true } }),
      this.prisma.vehicle.groupBy({ by: ['dealerId'], where: { ...inDealers, soldAt: { gte: recent } }, _count: { _all: true } }),
      this.prisma.lead.groupBy({ by: ['dealerId'], where: { ...inDealers, createdAt: { gte: recent } }, _count: { _all: true } }),
      this.prisma.lead.groupBy({ by: ['dealerId', 'stage'], where: { ...inDealers, createdAt: { gte: conversionSince } }, _count: { _all: true } }),
      this.prisma.$queryRaw<{ dealerId: string; days: number }[]>(Prisma.sql`
        SELECT "dealerId", avg(extract(epoch FROM ("soldAt" - "publishedAt")) / 86400)::float AS days
          FROM vehicles
         WHERE "soldAt" >= ${sellSince} AND "publishedAt" IS NOT NULL ${dealerFilter('"dealerId"', ids)}
         GROUP BY 1`),
      this.prisma.$queryRaw<{ dealerId: string; hours: number }[]>(Prisma.sql`
        SELECT "dealerId", avg(extract(epoch FROM ("firstResponseAt" - "createdAt")) / 3600)::float AS hours
          FROM leads
         WHERE "createdAt" >= ${conversionSince} AND "firstResponseAt" IS NOT NULL ${dealerFilter('"dealerId"', ids)}
         GROUP BY 1`),
      this.prisma.$queryRaw<{ dealerId: string; m: string; n: number }[]>(Prisma.sql`
        SELECT "dealerId", to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS m, count(*)::int AS n
          FROM leads WHERE "createdAt" >= ${start} ${dealerFilter('"dealerId"', ids)} GROUP BY 1, 2`),
      this.prisma.$queryRaw<{ dealerId: string; m: string; n: number }[]>(Prisma.sql`
        SELECT "dealerId", to_char(date_trunc('month', "soldAt"), 'YYYY-MM') AS m, count(*)::int AS n
          FROM vehicles WHERE "soldAt" >= ${start} ${dealerFilter('"dealerId"', ids)} GROUP BY 1, 2`),
      this.prisma.$queryRaw<{ dealerId: string; m: string; n: number }[]>(Prisma.sql`
        SELECT v."dealerId", to_char(date_trunc('month', d.day), 'YYYY-MM') AS m, sum(d.views)::int AS n
          FROM vehicle_view_daily d JOIN vehicles v ON v.id = d."vehicleId"
         WHERE d.day >= ${start}::date ${dealerFilter('v."dealerId"', ids)} GROUP BY 1, 2`),
    ]);

    const series = (rows: { dealerId: string; m: string; n: number }[], dealerId: string) =>
      months.map((month) => ({ month: month.label, value: rows.find((row) => row.dealerId === dealerId && row.m === month.key)?.n ?? 0 }));

    for (const id of ids) {
      const stats = result.get(id)!;
      const listing = listings.find((row) => row.dealerId === id);
      stats.activeListings = listing?._count._all ?? 0;
      stats.stockValue = listing?._sum.price ?? 0;
      stats.views = views.find((row) => row.dealerId === id)?._sum.viewCount ?? 0;
      stats.soldThisMonth = sold.find((row) => row.dealerId === id)?._count._all ?? 0;
      stats.leads = leads.find((row) => row.dealerId === id)?._count._all ?? 0;
      const mine = outcomes.filter((row) => row.dealerId === id);
      const total = mine.reduce((sum, row) => sum + row._count._all, 0);
      const won = mine.find((row) => row.stage === LeadStage.WON)?._count._all ?? 0;
      stats.conversionRate = total ? won / total : 0;
      stats.avgDaysToSell = Math.round(speed.find((row) => row.dealerId === id)?.days ?? 0);
      stats.responseHours = round1(response.find((row) => row.dealerId === id)?.hours ?? 0);
      stats.monthlyLeads = series(leadMonths, id);
      stats.monthlySold = series(soldMonths, id);
      stats.monthlyViews = series(viewMonths, id);
    }
    return result;
  }
}

const dealerSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  city: true,
  province: true,
  plan: true,
  status: true,
  rating: true,
  createdAt: true,
  members: { where: { role: DealerMemberRole.OWNER }, take: 1, select: { role: true, user: { select: { firstName: true, lastName: true } } } },
} satisfies Prisma.DealerSelect;

type DealerRow = Prisma.DealerGetPayload<{ select: typeof dealerSelect }>;

function emptyStats(): WebDealerStats {
  const months = monthWindow().map((month) => ({ month: month.label, value: 0 }));
  return {
    activeListings: 0,
    soldThisMonth: 0,
    views: 0,
    leads: 0,
    conversionRate: 0,
    avgDaysToSell: 0,
    stockValue: 0,
    responseHours: 0,
    monthlyLeads: months,
    monthlyViews: months.map((point) => ({ ...point })),
    monthlySold: months.map((point) => ({ ...point })),
  };
}
