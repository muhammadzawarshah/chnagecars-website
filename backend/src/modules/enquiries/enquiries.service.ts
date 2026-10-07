import { Injectable } from '@nestjs/common';
import {
  DealerStatus,
  Enquiry,
  EnquiryStatus,
  EnquiryType,
  LeadActivityType,
  LeadSource,
  LeadStage,
  Prisma,
} from '../../generated/prisma/client';
import { pageArgs, toPage } from '../../common/dto/pagination.dto';
import { Errors } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/types/auth-user';
import { generateReference } from '../../common/utils/strings';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { LeadsService } from '../crm/leads.service';
import { DealerAccessService, DealerContext } from '../dealers/dealer-access';
import { acceptsEnquiries } from '../vehicles/vehicle-lifecycle';
import { POPULARITY } from '../vehicles/public-vehicles.service';
import {
  AdminEnquiryQueryDto,
  AdminUpdateEnquiryDto,
  ContactDto,
  EnquiryQueryDto,
  RespondDto,
} from './dto/enquiry.dto';

export interface SubmitEnquiryInput {
  type: EnquiryType;
  contact: ContactDto;
  message?: string | null;
  vehicleId?: string;
  dealerId?: string;
  makeId?: string;
  modelId?: string;
  variantId?: string;
  details?: Record<string, unknown>;
  source?: string;
}

const LEAD_SOURCE: Partial<Record<EnquiryType, LeadSource>> = {
  VEHICLE: LeadSource.WEBSITE_ENQUIRY,
  TEST_DRIVE: LeadSource.WEBSITE_ENQUIRY,
  FINANCE: LeadSource.WEBSITE_ENQUIRY,
  INSURANCE: LeadSource.WEBSITE_ENQUIRY,
  QUOTE: LeadSource.QUOTE_REQUEST,
  BEAT_MY_QUOTE: LeadSource.QUOTE_REQUEST,
  TRADE_IN: LeadSource.TRADE_IN,
};

/** Types that are purchase intent for one specific listing (FR-51 availability check applies). */
const PURCHASE_TYPES: EnquiryType[] = [EnquiryType.VEHICLE, EnquiryType.TEST_DRIVE, EnquiryType.TRADE_IN, EnquiryType.FINANCE];
const DUPLICATE_WINDOW_MS = 10 * 60_000;

const customerInclude = {
  vehicle: { select: { id: true, title: true, slug: true, primaryImageUrl: true, price: true, status: true } },
  dealer: { select: { id: true, name: true, slug: true, phone: true, email: true } },
  responses: { orderBy: { createdAt: 'asc' as const }, select: { id: true, authorType: true, message: true, createdAt: true } },
  lead: { select: { stage: true, nextFollowUpAt: true } },
} satisfies Prisma.EnquiryInclude;

/**
 * One enquiry pipeline for every customer request (FR-33): vehicle enquiries, quotes,
 * Beat My Quote, trade-ins, concierge, help-me-find, finance, insurance, test drives, contact.
 * Requests tied to a dealer automatically open a CRM lead for that dealer.
 */
@Injectable()
export class EnquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leads: LeadsService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
    private readonly storage: StorageService,
  ) {}

  async submit(input: SubmitEnquiryInput, user?: AuthUser) {
    let dealerId = input.dealerId ?? null;
    let branchId: string | null = null;

    if (input.vehicleId) {
      // Source of truth is the primary DB, never the search index or cache.
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: input.vehicleId },
        select: { id: true, status: true, dealerId: true, branchId: true, makeId: true, modelId: true, variantId: true, dealer: { select: { status: true } } },
      });
      if (!vehicle || vehicle.dealer.status !== DealerStatus.APPROVED) throw Errors.notFound('Vehicle');
      if (PURCHASE_TYPES.includes(input.type) && !acceptsEnquiries(vehicle.status)) {
        throw Errors.conflict('VEHICLE_NOT_AVAILABLE', 'This vehicle is no longer available for enquiries');
      }
      dealerId = vehicle.dealerId;
      branchId = vehicle.branchId;
      input.makeId ??= vehicle.makeId;
      input.modelId ??= vehicle.modelId;
      input.variantId ??= vehicle.variantId ?? undefined;
    } else if (dealerId) {
      const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId }, select: { status: true } });
      if (!dealer || dealer.status !== DealerStatus.APPROVED) throw Errors.badRequest('INVALID_DEALER', 'Dealer not found');
    }
    await this.assertCatalogue(input.makeId, input.modelId, input.variantId);

    const duplicate = await this.prisma.enquiry.findFirst({
      where: {
        email: input.contact.email,
        type: input.type,
        vehicleId: input.vehicleId ?? null,
        modelId: input.modelId ?? null,
        // Different forms (contact, specials, keep-it…) share the GENERAL type; only the same form is a repeat.
        source: input.source ?? 'web',
        status: EnquiryStatus.NEW,
        createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      },
    });
    if (duplicate) return this.receipt(duplicate, true);

    const enquiry = await this.prisma.$transaction(async (tx) => {
      const created = await tx.enquiry.create({
        data: {
          reference: generateReference('ENQ'),
          type: input.type,
          customerId: user?.id ?? null,
          name: input.contact.name,
          email: input.contact.email,
          phone: input.contact.phone,
          message: input.message ?? null,
          vehicleId: input.vehicleId ?? null,
          dealerId,
          branchId,
          makeId: input.makeId ?? null,
          modelId: input.modelId ?? null,
          variantId: input.variantId ?? null,
          details: (input.details ?? {}) as Prisma.InputJsonValue,
          source: input.source ?? 'web',
          consentAt: new Date(),
        },
      });
      if (dealerId) {
        await this.leads.createLead(tx, {
          dealerId,
          branchId,
          customerId: user?.id ?? null,
          enquiryId: created.id,
          vehicleId: input.vehicleId ?? null,
          name: input.contact.name,
          email: input.contact.email,
          phone: input.contact.phone,
          source: LEAD_SOURCE[input.type] ?? LeadSource.WEBSITE_ENQUIRY,
          note: `${input.type.replace(/_/g, ' ').toLowerCase()} enquiry ${created.reference}`,
        });
      }
      if (input.vehicleId) {
        await tx.vehicle.update({
          where: { id: input.vehicleId },
          data: { enquiryCount: { increment: 1 }, popularityScore: { increment: POPULARITY.enquiry } },
        });
      }
      await this.outbox.enqueue(tx, {
        type: OutboxEvents.EnquiryCreated,
        aggregateType: 'enquiry',
        aggregateId: created.id,
        payload: { enquiryId: created.id },
      });
      await this.audit.record({ action: 'enquiry.create', entityType: 'enquiry', entityId: created.id, after: { type: created.type, reference: created.reference, dealerId } }, tx);
      return created;
    });
    return this.receipt(enquiry, false);
  }

  private receipt(enquiry: Enquiry, duplicate: boolean) {
    return { id: enquiry.id, reference: enquiry.reference, type: enquiry.type, status: enquiry.status, createdAt: enquiry.createdAt, duplicate };
  }

  private async assertCatalogue(makeId?: string, modelId?: string, variantId?: string) {
    if (modelId) {
      const model = await this.prisma.model.findUnique({ where: { id: modelId }, select: { makeId: true } });
      if (!model || (makeId && model.makeId !== makeId)) throw Errors.badRequest('MODEL_MAKE_MISMATCH', 'Model does not belong to the selected make');
    }
    if (variantId) {
      const variant = await this.prisma.variant.findUnique({ where: { id: variantId }, select: { modelId: true } });
      if (!variant || (modelId && variant.modelId !== modelId)) throw Errors.badRequest('VARIANT_MODEL_MISMATCH', 'Variant does not belong to the selected model');
    }
  }

  private filters(query: EnquiryQueryDto): Prisma.EnquiryWhereInput {
    return {
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { reference: { contains: query.q, mode: 'insensitive' } },
              { name: { contains: query.q, mode: 'insensitive' } },
              { email: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private async page(where: Prisma.EnquiryWhereInput, query: EnquiryQueryDto, include: Prisma.EnquiryInclude) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const [rows, total] = await Promise.all([
      this.prisma.enquiry.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.enquiry.count({ where }),
    ]);
    return toPage(rows, total, page, pageSize);
  }

  // ───────────── customer (FR-42) ─────────────

  listMine(userId: string, query: EnquiryQueryDto) {
    return this.page({ customerId: userId, ...this.filters(query) }, query, customerInclude);
  }

  async getMine(userId: string, id: string) {
    const enquiry = await this.prisma.enquiry.findFirst({ where: { id, customerId: userId }, include: customerInclude });
    if (!enquiry) throw Errors.notFound('Enquiry');
    return enquiry;
  }

  async customerReply(userId: string, id: string, message: string) {
    const enquiry = await this.getMine(userId, id);
    if (enquiry.status === EnquiryStatus.CLOSED || enquiry.status === EnquiryStatus.CANCELLED) {
      throw Errors.conflict('ENQUIRY_CLOSED', 'This enquiry is closed');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.enquiryResponse.create({ data: { enquiryId: id, authorId: userId, authorType: 'CUSTOMER', message } });
      await tx.enquiry.update({ where: { id }, data: { status: EnquiryStatus.IN_PROGRESS } });
      const lead = await tx.lead.findUnique({ where: { enquiryId: id } });
      if (lead) await tx.leadActivity.create({ data: { leadId: lead.id, type: LeadActivityType.NOTE, note: `Customer replied: ${message.slice(0, 500)}` } });
    });
    return this.getMine(userId, id);
  }

  async cancelMine(userId: string, id: string) {
    const enquiry = await this.getMine(userId, id);
    if (enquiry.status === EnquiryStatus.CLOSED || enquiry.status === EnquiryStatus.CANCELLED) return enquiry;
    await this.prisma.enquiry.update({ where: { id }, data: { status: EnquiryStatus.CANCELLED, closedAt: new Date() } });
    await this.audit.record({ action: 'enquiry.cancel', entityType: 'enquiry', entityId: id, before: { status: enquiry.status }, after: { status: EnquiryStatus.CANCELLED } });
    return this.getMine(userId, id);
  }

  // ───────────── dealer ─────────────

  listForDealer(ctx: DealerContext, query: EnquiryQueryDto) {
    return this.page(
      { dealerId: ctx.dealerId, ...DealerAccessService.branchScope(ctx), ...this.filters(query) },
      query,
      { vehicle: { select: { id: true, title: true, slug: true } }, lead: { select: { id: true, stage: true, assignedToId: true } }, _count: { select: { responses: true } } },
    );
  }

  async getForDealer(ctx: DealerContext, id: string) {
    const enquiry = await this.prisma.enquiry.findFirst({
      where: { id, dealerId: ctx.dealerId, ...DealerAccessService.branchScope(ctx) },
      include: { vehicle: true, responses: { orderBy: { createdAt: 'asc' } }, lead: true, make: true, model: true, variant: true },
    });
    if (!enquiry) throw Errors.notFound('Enquiry');
    return this.withAttachmentLinks(enquiry);
  }

  async respondAsDealer(ctx: DealerContext, id: string, dto: RespondDto) {
    const enquiry = await this.getForDealer(ctx, id);
    return this.respond(enquiry, dto, ctx.userId, 'DEALER');
  }

  // ───────────── admin (FR-34 manage enquiries) ─────────────

  listForAdmin(query: AdminEnquiryQueryDto) {
    return this.page(
      {
        ...this.filters(query),
        ...(query.dealerId ? { dealerId: query.dealerId } : {}),
        ...(query.platformOnly ? { dealerId: null } : {}),
      },
      query,
      { dealer: { select: { id: true, name: true } }, vehicle: { select: { id: true, title: true } }, _count: { select: { responses: true } } },
    );
  }

  async getForAdmin(id: string) {
    const enquiry = await this.prisma.enquiry.findUnique({
      where: { id },
      include: { vehicle: true, dealer: true, responses: { orderBy: { createdAt: 'asc' } }, lead: true, make: true, model: true, variant: true, customer: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    if (!enquiry) throw Errors.notFound('Enquiry');
    return this.withAttachmentLinks(enquiry);
  }

  /** Files sent with a website form (e.g. a Beat My Quote quote) are private: staff get short-lived links. */
  private async withAttachmentLinks<T extends { details: Prisma.JsonValue }>(enquiry: T): Promise<T> {
    const details = enquiry.details && typeof enquiry.details === 'object' && !Array.isArray(enquiry.details) ? (enquiry.details as Record<string, unknown>) : null;
    if (!details || !Array.isArray(details.attachments) || !details.attachments.length) return enquiry;
    const attachments = await Promise.all(
      (details.attachments as { storageKey: string }[]).map(async (file) => ({
        ...file,
        url: await this.storage.presignDownload(file.storageKey).catch(() => null),
      })),
    );
    return { ...enquiry, details: { ...details, attachments } };
  }

  async respondAsAdmin(id: string, dto: RespondDto, adminId: string) {
    const enquiry = await this.getForAdmin(id);
    return this.respond(enquiry, dto, adminId, 'ADMIN');
  }

  async adminUpdate(id: string, dto: AdminUpdateEnquiryDto) {
    const before = await this.getForAdmin(id);
    if (dto.dealerId && before.dealerId && dto.dealerId !== before.dealerId) {
      throw Errors.conflict('ALREADY_ROUTED', 'This enquiry is already assigned to a dealer');
    }
    return this.prisma.$transaction(async (tx) => {
      if (dto.dealerId && !before.dealerId) {
        const dealer = await tx.dealer.findUnique({ where: { id: dto.dealerId }, select: { status: true } });
        if (!dealer || dealer.status !== DealerStatus.APPROVED) throw Errors.badRequest('INVALID_DEALER', 'Dealer must be approved');
        await this.leads.createLead(tx, {
          dealerId: dto.dealerId,
          customerId: before.customerId,
          enquiryId: id,
          name: before.name,
          email: before.email,
          phone: before.phone,
          source: LEAD_SOURCE[before.type] ?? LeadSource.OTHER,
          note: `Routed by ChangeCars team (${before.reference})`,
        });
        await this.outbox.enqueue(tx, { type: OutboxEvents.EnquiryCreated, aggregateType: 'enquiry', aggregateId: id, payload: { enquiryId: id, routed: true } });
      }
      const after = await tx.enquiry.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.status === EnquiryStatus.CLOSED || dto.status === EnquiryStatus.CANCELLED ? { closedAt: new Date() } : {}),
        },
      });
      await this.audit.record({ action: 'enquiry.admin_update', entityType: 'enquiry', entityId: id, before: { status: before.status, dealerId: before.dealerId, assignedAdminId: before.assignedAdminId }, after: dto }, tx);
      return after;
    });
  }

  private async respond(enquiry: Enquiry, dto: RespondDto, authorId: string, authorType: 'DEALER' | 'ADMIN') {
    if (enquiry.status === EnquiryStatus.CANCELLED) throw Errors.conflict('ENQUIRY_CANCELLED', 'The customer cancelled this enquiry');
    const status = dto.status ?? EnquiryStatus.RESPONDED;
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const response = await tx.enquiryResponse.create({ data: { enquiryId: enquiry.id, authorId, authorType, message: dto.message } });
      await tx.enquiry.update({ where: { id: enquiry.id }, data: { status, ...(status === EnquiryStatus.CLOSED ? { closedAt: now } : {}) } });
      const lead = await tx.lead.findUnique({ where: { enquiryId: enquiry.id } });
      if (lead) {
        await tx.lead.update({
          where: { id: lead.id },
          data: { lastContactedAt: now, ...(lead.firstResponseAt ? {} : { firstResponseAt: now }), ...(lead.stage === LeadStage.NEW ? { stage: LeadStage.CONTACTED } : {}) },
        });
        await tx.leadActivity.create({
          data: {
            leadId: lead.id,
            actorId: authorId,
            type: lead.stage === LeadStage.NEW ? LeadActivityType.STAGE_CHANGE : LeadActivityType.EMAIL,
            fromStage: lead.stage === LeadStage.NEW ? LeadStage.NEW : null,
            toStage: lead.stage === LeadStage.NEW ? LeadStage.CONTACTED : null,
            note: `Replied to enquiry: ${dto.message.slice(0, 500)}`,
          },
        });
      }
      await this.outbox.enqueue(tx, {
        type: OutboxEvents.EnquiryResponded,
        aggregateType: 'enquiry',
        aggregateId: enquiry.id,
        payload: { enquiryId: enquiry.id, responseId: response.id },
      });
      await this.audit.record({ action: 'enquiry.respond', entityType: 'enquiry', entityId: enquiry.id, before: { status: enquiry.status }, after: { status } }, tx);
    });
    return this.prisma.enquiry.findUniqueOrThrow({ where: { id: enquiry.id }, include: { responses: { orderBy: { createdAt: 'asc' } } } });
  }
}
