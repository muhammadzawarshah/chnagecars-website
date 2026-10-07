import { Injectable } from '@nestjs/common';
import {
  DealerMemberStatus,
  DealerPermission,
  Lead,
  LeadActivityType,
  LeadSource,
  LeadStage,
  Prisma,
} from '../../generated/prisma/client';
import { pageArgs, toPage } from '../../common/dto/pagination.dto';
import { Errors } from '../../common/errors/app-error';
import { AuditService } from '../../infrastructure/audit/audit.service';
import type { Db } from '../../infrastructure/database';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { DealerAccessService, DealerContext } from '../dealers/dealer-access';
import { AddActivityDto, AssignLeadDto, ChangeStageDto, CreateLeadDto, LeadQueryDto, UpdateLeadDto } from './dto/lead.dto';
import { checkStageChange } from './lead-stages';

const CONTACT_TYPES: LeadActivityType[] = [
  LeadActivityType.CALL,
  LeadActivityType.EMAIL,
  LeadActivityType.SMS,
  LeadActivityType.WHATSAPP,
  LeadActivityType.MEETING,
];

export interface NewLeadInput {
  dealerId: string;
  branchId?: string | null;
  customerId?: string | null;
  enquiryId?: string | null;
  vehicleId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: LeadSource;
  note?: string;
  stage?: LeadStage;
}

/** Dealer CRM (FR-43, FR-44, FR-46). All queries are scoped to the member's dealership and branch. */
@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  /** Used by enquiries, quotes, trade-ins and accepted offers to open a lead inside their transaction. */
  async createLead(db: Db, input: NewLeadInput, actorId: string | null = null): Promise<Lead> {
    const lead = await db.lead.create({
      data: {
        dealerId: input.dealerId,
        branchId: input.branchId ?? null,
        customerId: input.customerId ?? null,
        enquiryId: input.enquiryId ?? null,
        vehicleId: input.vehicleId ?? null,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        source: input.source,
        stage: input.stage ?? LeadStage.NEW,
      },
    });
    await db.leadActivity.create({
      data: { leadId: lead.id, actorId, type: LeadActivityType.SYSTEM, note: input.note ?? `Lead created from ${input.source.toLowerCase().replace(/_/g, ' ')}`, toStage: lead.stage },
    });
    return lead;
  }

  private scope(ctx: DealerContext): Prisma.LeadWhereInput {
    return {
      dealerId: ctx.dealerId,
      ...DealerAccessService.branchScope(ctx),
      ...(ctx.permissions.includes(DealerPermission.LEADS_VIEW_ALL) ? {} : { assignedToId: ctx.memberId }),
    };
  }

  private canManage(ctx: DealerContext, lead: Lead): boolean {
    if (ctx.permissions.includes(DealerPermission.LEADS_MANAGE_ALL)) return true;
    return ctx.permissions.includes(DealerPermission.LEADS_MANAGE_ASSIGNED) && lead.assignedToId === ctx.memberId;
  }

  private async managedLead(ctx: DealerContext, id: string): Promise<Lead> {
    const lead = await this.prisma.lead.findFirst({ where: { id, ...this.scope(ctx) } });
    if (!lead) throw Errors.notFound('Lead');
    if (!this.canManage(ctx, lead)) throw Errors.forbidden('LEAD_NOT_ASSIGNED', 'You can only manage leads assigned to you');
    return lead;
  }

  async list(ctx: DealerContext, query: LeadQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const assigned =
      query.assignedTo === 'me' ? { assignedToId: ctx.memberId } : query.assignedTo === 'unassigned' ? { assignedToId: null } : query.assignedTo ? { assignedToId: query.assignedTo } : {};
    const where: Prisma.LeadWhereInput = {
      AND: [
        this.scope(ctx),
        assigned,
        query.stage ? { stage: query.stage } : {},
        query.branchId ? { branchId: query.branchId } : {},
        query.source ? { source: query.source } : {},
        query.followUpDue ? { nextFollowUpAt: { lte: new Date() }, stage: { notIn: [LeadStage.WON, LeadStage.LOST] } } : {},
        query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: 'insensitive' } },
                { email: { contains: query.q, mode: 'insensitive' } },
                { phone: { contains: query.q } },
              ],
            }
          : {},
      ],
    };
    const [rows, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take,
        include: {
          vehicle: { select: { id: true, title: true, slug: true, primaryImageUrl: true, price: true } },
          assignedTo: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
          branch: { select: { id: true, name: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);
    return toPage(rows, total, page, pageSize);
  }

  async get(ctx: DealerContext, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, ...this.scope(ctx) },
      include: {
        vehicle: { select: { id: true, title: true, slug: true, primaryImageUrl: true, price: true, status: true } },
        enquiry: { include: { responses: { orderBy: { createdAt: 'asc' } } } },
        assignedTo: { select: { id: true, role: true, user: { select: { firstName: true, lastName: true, email: true } } } },
        branch: { select: { id: true, name: true } },
        activities: { orderBy: { createdAt: 'desc' }, take: 200 },
        deal: true,
      },
    });
    if (!lead) throw Errors.notFound('Lead');
    return lead;
  }

  async create(ctx: DealerContext, dto: CreateLeadDto) {
    if (dto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findFirst({ where: { id: dto.vehicleId, dealerId: ctx.dealerId } });
      if (!vehicle) throw Errors.badRequest('INVALID_VEHICLE', 'Vehicle does not belong to your dealership');
    }
    const branchId = dto.branchId ?? (ctx.wideScope ? null : ctx.branchId);
    if (branchId) {
      const branch = await this.prisma.branch.findFirst({ where: { id: branchId, dealerId: ctx.dealerId } });
      if (!branch) throw Errors.badRequest('INVALID_BRANCH', 'Branch does not belong to your dealership');
    }
    const assignedToId = dto.assignedToId ?? (ctx.permissions.includes(DealerPermission.LEADS_ASSIGN) ? null : ctx.memberId);
    if (assignedToId && assignedToId !== ctx.memberId) {
      if (!ctx.permissions.includes(DealerPermission.LEADS_ASSIGN)) throw Errors.forbidden('MISSING_DEALER_PERMISSION', 'You cannot assign leads to others');
      await this.assertMember(ctx, assignedToId);
    }
    return this.prisma.$transaction(async (tx) => {
      const lead = await this.createLead(tx, { dealerId: ctx.dealerId, branchId, vehicleId: dto.vehicleId, name: dto.name, email: dto.email, phone: dto.phone, source: dto.source, note: dto.note }, ctx.userId);
      const updated = await tx.lead.update({
        where: { id: lead.id },
        data: { assignedToId, nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null },
      });
      await this.audit.record({ action: 'lead.create', entityType: 'lead', entityId: lead.id, after: updated }, tx);
      return updated;
    });
  }

  async update(ctx: DealerContext, id: string, dto: UpdateLeadDto) {
    const before = await this.managedLead(ctx, id);
    if (dto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findFirst({ where: { id: dto.vehicleId, dealerId: ctx.dealerId } });
      if (!vehicle) throw Errors.badRequest('INVALID_VEHICLE', 'Vehicle does not belong to your dealership');
    }
    return this.prisma.$transaction(async (tx) => {
      const after = await tx.lead.update({
        where: { id },
        data: {
          ...dto,
          nextFollowUpAt: dto.nextFollowUpAt === undefined ? undefined : dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null,
        },
      });
      if (dto.nextFollowUpAt) {
        await tx.leadActivity.create({ data: { leadId: id, actorId: ctx.userId, type: LeadActivityType.FOLLOW_UP_SET, note: `Follow-up scheduled for ${dto.nextFollowUpAt}` } });
      }
      await this.audit.record({ action: 'lead.update', entityType: 'lead', entityId: id, before, after }, tx);
      return after;
    });
  }

  /** FR-44 stage change with audit history of every transition. */
  async changeStage(ctx: DealerContext, id: string, dto: ChangeStageDto) {
    const lead = await this.managedLead(ctx, id);
    const check = checkStageChange(lead.stage, dto.stage, ctx.permissions.includes(DealerPermission.LEADS_MANAGE_ALL));
    if (!check.ok) throw Errors.conflict('INVALID_STAGE_TRANSITION', check.reason);
    if (dto.stage === LeadStage.LOST && !dto.lostReason) throw Errors.badRequest('REASON_REQUIRED', 'lostReason is required when marking a lead as lost');

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const result = await tx.lead.updateMany({
        where: { id, stage: lead.stage },
        data: {
          stage: dto.stage,
          ...(dto.stage === LeadStage.WON ? { wonAt: now, nextFollowUpAt: null } : {}),
          ...(dto.stage === LeadStage.LOST ? { lostAt: now, lostReason: dto.lostReason, nextFollowUpAt: null } : {}),
          ...(dto.stage === LeadStage.CONTACTED && !lead.firstResponseAt ? { firstResponseAt: now, lastContactedAt: now } : {}),
          ...(lead.stage === LeadStage.WON || lead.stage === LeadStage.LOST ? { wonAt: null, lostAt: null, lostReason: null } : {}),
        },
      });
      if (result.count !== 1) throw Errors.conflict('CONCURRENT_UPDATE', 'The lead changed meanwhile; reload and retry');
      await tx.leadActivity.create({
        data: { leadId: id, actorId: ctx.userId, type: LeadActivityType.STAGE_CHANGE, fromStage: lead.stage, toStage: dto.stage, note: dto.note ?? dto.lostReason },
      });
      await this.audit.record({ action: 'lead.stage_change', entityType: 'lead', entityId: id, before: { stage: lead.stage }, after: { stage: dto.stage, lostReason: dto.lostReason } }, tx);
      return tx.lead.findUniqueOrThrow({ where: { id } });
    });
  }

  async assign(ctx: DealerContext, id: string, dto: AssignLeadDto) {
    const lead = await this.prisma.lead.findFirst({ where: { id, dealerId: ctx.dealerId, ...DealerAccessService.branchScope(ctx) } });
    if (!lead) throw Errors.notFound('Lead');
    if (dto.memberId) await this.assertMember(ctx, dto.memberId);
    return this.prisma.$transaction(async (tx) => {
      const after = await tx.lead.update({ where: { id }, data: { assignedToId: dto.memberId } });
      await tx.leadActivity.create({
        data: { leadId: id, actorId: ctx.userId, type: LeadActivityType.ASSIGNMENT, note: dto.memberId ? 'Lead assigned' : 'Lead unassigned', metadata: { from: lead.assignedToId, to: dto.memberId } },
      });
      await this.audit.record({ action: 'lead.assign', entityType: 'lead', entityId: id, before: { assignedToId: lead.assignedToId }, after: { assignedToId: dto.memberId } }, tx);
      if (dto.memberId && dto.memberId !== lead.assignedToId) {
        await this.outbox.enqueue(tx, { type: OutboxEvents.LeadAssigned, aggregateType: 'lead', aggregateId: id, payload: { leadId: id, memberId: dto.memberId } });
      }
      return after;
    });
  }

  /** Contact history + response tracking (FR-43). */
  async addActivity(ctx: DealerContext, id: string, dto: AddActivityDto) {
    const lead = await this.managedLead(ctx, id);
    const isContact = CONTACT_TYPES.includes(dto.type);
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.leadActivity.create({ data: { leadId: id, actorId: ctx.userId, type: dto.type, note: dto.note } });
      await tx.lead.update({
        where: { id },
        data: {
          ...(isContact ? { lastContactedAt: now, ...(lead.firstResponseAt ? {} : { firstResponseAt: now }) } : {}),
          ...(dto.nextFollowUpAt ? { nextFollowUpAt: new Date(dto.nextFollowUpAt) } : {}),
        },
      });
      return activity;
    });
  }

  /** Pipeline numbers for the dealer dashboard (FR-13, FR-43 response tracking). */
  async stats(ctx: DealerContext) {
    const scope = this.scope(ctx);
    const since = new Date(Date.now() - 90 * 86_400_000);
    const [byStage, responded, overdue] = await Promise.all([
      this.prisma.lead.groupBy({ by: ['stage'], where: scope, _count: { _all: true } }),
      this.prisma.lead.findMany({ where: { ...scope, createdAt: { gte: since }, firstResponseAt: { not: null } }, select: { createdAt: true, firstResponseAt: true }, take: 5000 }),
      this.prisma.lead.count({ where: { ...scope, nextFollowUpAt: { lte: new Date() }, stage: { notIn: [LeadStage.WON, LeadStage.LOST] } } }),
    ]);
    const counts = Object.fromEntries(byStage.map((row) => [row.stage, row._count._all])) as Partial<Record<LeadStage, number>>;
    const won = counts.WON ?? 0;
    const lost = counts.LOST ?? 0;
    const avgMinutes = responded.length
      ? Math.round(responded.reduce((sum, row) => sum + (row.firstResponseAt!.getTime() - row.createdAt.getTime()), 0) / responded.length / 60000)
      : null;
    return {
      byStage: counts,
      total: byStage.reduce((sum, row) => sum + row._count._all, 0),
      conversionRate: won + lost ? Math.round((won / (won + lost)) * 1000) / 10 : null,
      averageFirstResponseMinutes: avgMinutes,
      overdueFollowUps: overdue,
    };
  }

  private async assertMember(ctx: DealerContext, memberId: string) {
    const member = await this.prisma.dealerMember.findFirst({ where: { id: memberId, dealerId: ctx.dealerId, status: DealerMemberStatus.ACTIVE } });
    if (!member) throw Errors.badRequest('INVALID_MEMBER', 'Staff member not found in your dealership');
  }
}
