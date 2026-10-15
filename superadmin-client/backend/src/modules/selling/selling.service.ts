import { Injectable, Logger } from '@nestjs/common';
import {
  OfferStatus,
  Prisma,
  SellMediaKind,
  SellRequestStatus,
  SellRequestType,
  ValuationMethod,
  VehicleStatus,
} from '../../generated/prisma/client';
import { pageArgs, toPage } from '../../common/dto/pagination.dto';
import { Errors } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/types/auth-user';
import { generateReference, shortId } from '../../common/utils/strings';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import {
  AdminSellStatusDto,
  ConfirmSellImageDto,
  CreateSellRequestDto,
  ManualValuationDto,
  SellImageUploadDto,
  SellRequestQueryDto,
} from './dto/selling.dto';
import { estimateValuation } from './valuation.calculator';

const ACTIVE_OFFER: OfferStatus[] = [OfferStatus.SUBMITTED, OfferStatus.UPDATED, OfferStatus.PENDING];
const CLOSED_REQUEST: SellRequestStatus[] = [SellRequestStatus.COMPLETED, SellRequestStatus.CANCELLED, SellRequestStatus.REJECTED];
const MAX_SELL_IMAGES = 20;

/** Sell-your-vehicle and valuation workflow (FR-08, FR-09). Offers come from the bidding module. */
@Injectable()
export class SellingService {
  private readonly logger = new Logger(SellingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
    private readonly storage: StorageService,
  ) {}

  async create(dto: CreateSellRequestDto, user?: AuthUser) {
    const names = await this.resolveNames(dto);
    const request = await this.prisma.$transaction(async (tx) => {
      const created = await tx.sellRequest.create({
        data: {
          reference: generateReference('SELL'),
          type: dto.type,
          customerId: user?.id ?? null,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          province: dto.province,
          city: dto.city,
          makeId: dto.makeId,
          modelId: dto.modelId,
          variantId: dto.variantId,
          ...names,
          year: dto.year,
          mileage: dto.mileage,
          condition: dto.condition,
          colour: dto.colour,
          transmission: dto.transmission,
          fuelType: dto.fuelType,
          registrationNumber: dto.registrationNumber,
          vin: dto.vin,
          hasServiceHistory: dto.hasServiceHistory,
          hasAccidentHistory: dto.hasAccidentHistory,
          hasOutstandingFinance: dto.hasOutstandingFinance,
          askingPrice: dto.askingPrice,
          notes: dto.notes,
        },
      });
      await this.outbox.enqueue(tx, {
        type: OutboxEvents.SellRequestCreated,
        aggregateType: 'sell_request',
        aggregateId: created.id,
        payload: { sellRequestId: created.id },
      });
      await this.audit.record({ action: 'sell_request.create', entityType: 'sell_request', entityId: created.id, after: { reference: created.reference, type: created.type } }, tx);
      return created;
    });
    return { id: request.id, reference: request.reference, type: request.type, status: request.status, createdAt: request.createdAt };
  }

  private async resolveNames(dto: CreateSellRequestDto) {
    let makeName = dto.makeName;
    let modelName = dto.modelName;
    let variantName = dto.variantName;
    if (dto.makeId) {
      const make = await this.prisma.make.findUnique({ where: { id: dto.makeId } });
      if (!make) throw Errors.badRequest('INVALID_MAKE', 'Make not found');
      makeName = make.name;
    }
    if (dto.modelId) {
      const model = await this.prisma.model.findUnique({ where: { id: dto.modelId } });
      if (!model || (dto.makeId && model.makeId !== dto.makeId)) throw Errors.badRequest('MODEL_MAKE_MISMATCH', 'Model does not belong to the selected make');
      modelName = model.name;
    }
    if (dto.variantId) {
      const variant = await this.prisma.variant.findUnique({ where: { id: dto.variantId } });
      if (!variant || (dto.modelId && variant.modelId !== dto.modelId)) throw Errors.badRequest('VARIANT_MODEL_MISMATCH', 'Variant does not belong to the selected model');
      variantName = variant.name;
    }
    return { makeName: makeName!, modelName: modelName!, variantName };
  }

  // ───────────── valuation (worker) ─────────────

  /** Runs in the worker after submission. Idempotent: skips if an automated valuation exists. */
  async autoValue(sellRequestId: string): Promise<boolean> {
    const request = await this.prisma.sellRequest.findUnique({
      where: { id: sellRequestId },
      include: { valuations: { where: { method: ValuationMethod.AUTOMATED }, take: 1 }, variant: { select: { basePrice: true } } },
    });
    if (!request || request.valuations.length || CLOSED_REQUEST.includes(request.status)) return false;

    const since = new Date(Date.now() - 365 * 86_400_000);
    const comparableWhere: Prisma.VehicleWhereInput = {
      year: { gte: request.year - 1, lte: request.year + 1 },
      status: { in: [VehicleStatus.PUBLISHED, VehicleStatus.RESERVED, VehicleStatus.SOLD] },
      updatedAt: { gte: since },
      ...(request.modelId
        ? { modelId: request.modelId }
        : { make: { name: { equals: request.makeName, mode: 'insensitive' } }, model: { name: { equals: request.modelName, mode: 'insensitive' } } }),
    };
    const comparables = await this.prisma.vehicle.findMany({ where: comparableWhere, select: { price: true }, take: 500 });
    const estimate = estimateValuation({
      year: request.year,
      mileage: request.mileage,
      condition: request.condition,
      comparablePrices: comparables.map((row) => row.price),
      listPrice: request.variant?.basePrice,
    });

    if (!estimate) {
      await this.prisma.sellRequest.updateMany({ where: { id: request.id, status: SellRequestStatus.SUBMITTED }, data: { status: SellRequestStatus.UNDER_REVIEW } });
      this.logger.log(`No data for automated valuation of ${request.reference}; sent to manual review`);
      return false;
    }

    await this.prisma.$transaction(async (tx) => {
      const valuation = await tx.valuation.create({
        data: {
          sellRequestId: request.id,
          method: ValuationMethod.AUTOMATED,
          estimateLow: estimate.low,
          estimateMid: estimate.mid,
          estimateHigh: estimate.high,
          comparableCount: estimate.comparableCount,
          notes: estimate.notes,
        },
      });
      await tx.sellRequest.updateMany({
        where: { id: request.id, status: { in: [SellRequestStatus.SUBMITTED, SellRequestStatus.UNDER_REVIEW] } },
        data: { status: SellRequestStatus.VALUED },
      });
      await this.outbox.enqueue(tx, {
        type: OutboxEvents.ValuationCompleted,
        aggregateType: 'sell_request',
        aggregateId: request.id,
        payload: { sellRequestId: request.id, valuationId: valuation.id },
      });
    });
    return true;
  }

  async manualValuation(id: string, dto: ManualValuationDto, adminId: string) {
    if (!(dto.estimateLow <= dto.estimateMid && dto.estimateMid <= dto.estimateHigh)) {
      throw Errors.badRequest('INVALID_RANGE', 'Expected estimateLow ≤ estimateMid ≤ estimateHigh');
    }
    const request = await this.adminGet(id);
    if (CLOSED_REQUEST.includes(request.status)) throw Errors.conflict('SELL_REQUEST_CLOSED', 'This request is closed');
    return this.prisma.$transaction(async (tx) => {
      const valuation = await tx.valuation.create({ data: { sellRequestId: id, method: ValuationMethod.MANUAL, ...dto, valuedById: adminId } });
      if (request.status === SellRequestStatus.SUBMITTED || request.status === SellRequestStatus.UNDER_REVIEW) {
        await tx.sellRequest.update({ where: { id }, data: { status: SellRequestStatus.VALUED } });
      }
      await this.outbox.enqueue(tx, {
        type: OutboxEvents.ValuationCompleted,
        aggregateType: 'sell_request',
        aggregateId: id,
        payload: { sellRequestId: id, valuationId: valuation.id },
      });
      await this.audit.record({ action: 'sell_request.valuation', entityType: 'sell_request', entityId: id, after: valuation }, tx);
      return valuation;
    });
  }

  // ───────────── customer (FR-40 "my valuations", "my offers") ─────────────

  async listMine(userId: string, query: SellRequestQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where: Prisma.SellRequestWhereInput = {
      customerId: userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.sellRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          valuations: { orderBy: { createdAt: 'desc' }, take: 1 },
          biddingSessions: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, status: true, closesAt: true, _count: { select: { offers: { where: { status: { in: ACTIVE_OFFER } } } } } } },
        },
      }),
      this.prisma.sellRequest.count({ where }),
    ]);
    return toPage(rows, total, page, pageSize);
  }

  async getMine(userId: string, id: string) {
    const request = await this.prisma.sellRequest.findFirst({
      where: { id, customerId: userId },
      include: {
        images: { orderBy: { position: 'asc' } },
        valuations: { orderBy: { createdAt: 'desc' } },
        biddingSessions: {
          orderBy: { createdAt: 'desc' },
          include: {
            offers: {
              orderBy: { amount: 'desc' },
              include: {
                dealer: { select: { id: true, name: true, slug: true, logoUrl: true, rating: true, province: true, city: true } },
                counterOffers: { orderBy: { createdAt: 'desc' } },
              },
            },
          },
        },
        deals: true,
      },
    });
    if (!request) throw Errors.notFound('Sell request');
    return {
      ...request,
      images: await this.withFileUrls(request.images),
      // dealer notes are internal to the dealer
      biddingSessions: request.biddingSessions.map((session) => ({
        ...session,
        offers: session.offers.map(({ dealerNotes, ...offer }) => offer),
      })),
    };
  }

  /** Customer asks the team to collect dealer offers (FR-08 step 5). */
  async requestOffers(userId: string, id: string) {
    const request = await this.prisma.sellRequest.findFirst({ where: { id, customerId: userId } });
    if (!request) throw Errors.notFound('Sell request');
    if (request.type === SellRequestType.VALUATION) {
      await this.prisma.sellRequest.update({ where: { id }, data: { type: SellRequestType.SELL } });
    }
    if (request.status !== SellRequestStatus.VALUED && request.status !== SellRequestStatus.SUBMITTED) {
      throw Errors.conflict('INVALID_STATE', `Offers cannot be requested while the request is ${request.status}`);
    }
    await this.prisma.sellRequest.update({ where: { id }, data: { status: SellRequestStatus.UNDER_REVIEW } });
    await this.audit.record({ action: 'sell_request.request_offers', entityType: 'sell_request', entityId: id });
    return this.getMine(userId, id);
  }

  async cancelMine(userId: string, id: string) {
    const request = await this.prisma.sellRequest.findFirst({ where: { id, customerId: userId } });
    if (!request) throw Errors.notFound('Sell request');
    if (request.status === SellRequestStatus.OFFER_ACCEPTED || CLOSED_REQUEST.includes(request.status)) {
      throw Errors.conflict('INVALID_STATE', `A request that is ${request.status} cannot be cancelled here`);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.sellRequest.update({ where: { id }, data: { status: SellRequestStatus.CANCELLED } });
      const sessions = await tx.biddingSession.findMany({ where: { sellRequestId: id, status: { in: ['SCHEDULED', 'OPEN', 'CLOSED'] } }, select: { id: true } });
      if (sessions.length) {
        await tx.biddingSession.updateMany({ where: { id: { in: sessions.map((s) => s.id) } }, data: { status: 'CANCELLED', closedAt: new Date() } });
        await tx.offer.updateMany({ where: { sessionId: { in: sessions.map((s) => s.id) }, status: { in: ACTIVE_OFFER } }, data: { status: OfferStatus.REJECTED, respondedAt: new Date() } });
      }
      await this.audit.record({ action: 'sell_request.cancel', entityType: 'sell_request', entityId: id, before: { status: request.status } }, tx);
    });
    return this.getMine(userId, id);
  }

  async imageUploadUrl(userId: string, id: string, dto: SellImageUploadDto) {
    const request = await this.prisma.sellRequest.findFirst({ where: { id, customerId: userId }, include: { _count: { select: { images: { where: { kind: SellMediaKind.PHOTO } } } } } });
    if (!request) throw Errors.notFound('Sell request');
    if (request._count.images >= MAX_SELL_IMAGES) throw Errors.conflict('TOO_MANY_IMAGES', `At most ${MAX_SELL_IMAGES} photos`);
    const extension = dto.contentType === 'image/png' ? 'png' : dto.contentType === 'image/webp' ? 'webp' : 'jpg';
    const storageKey = `media/sell-requests/${id}/${Date.now()}-${shortId(10)}.${extension}`;
    return { storageKey, uploadUrl: await this.storage.presignUpload(storageKey, dto.contentType), expiresIn: 600 };
  }

  async confirmImage(userId: string, id: string, dto: ConfirmSellImageDto) {
    const request = await this.prisma.sellRequest.findFirst({ where: { id, customerId: userId }, include: { _count: { select: { images: { where: { kind: SellMediaKind.PHOTO } } } } } });
    if (!request) throw Errors.notFound('Sell request');
    if (!dto.storageKey.startsWith(`media/sell-requests/${id}/`)) throw Errors.forbidden('INVALID_STORAGE_KEY', 'Storage key does not belong to this request');
    const object = await this.storage.head(dto.storageKey);
    if (!object) throw Errors.badRequest('UPLOAD_NOT_FOUND', 'The file has not been uploaded yet');
    if (object.size > 15 * 1024 * 1024) {
      await this.storage.delete(dto.storageKey).catch(() => undefined);
      throw Errors.badRequest('FILE_TOO_LARGE', 'Images may be at most 15 MB');
    }
    return this.prisma.sellRequestImage.create({
      data: { sellRequestId: id, storageKey: dto.storageKey, contentType: dto.contentType, position: request._count.images },
    });
  }

  // ───────────── admin ─────────────

  async adminList(query: SellRequestQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where: Prisma.SellRequestWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.q
        ? {
            OR: [
              { reference: { contains: query.q, mode: 'insensitive' } },
              { email: { contains: query.q, mode: 'insensitive' } },
              { makeName: { contains: query.q, mode: 'insensitive' } },
              { modelName: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.sellRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { valuations: { orderBy: { createdAt: 'desc' }, take: 1 }, _count: { select: { biddingSessions: true } } },
      }),
      this.prisma.sellRequest.count({ where }),
    ]);
    return toPage(rows, total, page, pageSize);
  }

  async adminGet(id: string) {
    const request = await this.prisma.sellRequest.findUnique({
      where: { id },
      include: {
        images: true,
        valuations: { orderBy: { createdAt: 'desc' } },
        biddingSessions: { orderBy: { createdAt: 'desc' }, include: { offers: { include: { dealer: { select: { id: true, name: true } }, revisions: true, counterOffers: true } }, invites: true } },
        deals: true,
        customer: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    if (!request) throw Errors.notFound('Sell request');
    return { ...request, images: await this.withFileUrls(request.images) };
  }

  /** Photos are public media; registration documents are private and only get a short-lived download link. */
  private withFileUrls<T extends { kind: SellMediaKind; storageKey: string }>(files: T[]) {
    return Promise.all(
      files.map(async (file) => ({
        ...file,
        url: file.kind === SellMediaKind.PHOTO ? this.storage.publicUrl(file.storageKey) : await this.storage.presignDownload(file.storageKey),
      })),
    );
  }

  async adminSetStatus(id: string, dto: AdminSellStatusDto) {
    const request = await this.adminGet(id);
    if (CLOSED_REQUEST.includes(request.status) && dto.status !== SellRequestStatus.COMPLETED) {
      throw Errors.conflict('SELL_REQUEST_CLOSED', 'This request is already closed');
    }
    if (dto.status === SellRequestStatus.COMPLETED && request.status !== SellRequestStatus.OFFER_ACCEPTED) {
      throw Errors.conflict('INVALID_STATE', 'Only requests with an accepted offer can be completed');
    }
    return this.prisma.$transaction(async (tx) => {
      const after = await tx.sellRequest.update({ where: { id }, data: { status: dto.status } });
      if (dto.status === SellRequestStatus.COMPLETED) {
        await tx.deal.updateMany({ where: { sellRequestId: id, status: 'OPEN' }, data: { status: 'COMPLETED', completedAt: new Date() } });
      }
      await this.audit.record({ action: 'sell_request.status', entityType: 'sell_request', entityId: id, before: { status: request.status }, after: { status: dto.status, reason: dto.reason } }, tx);
      return after;
    });
  }
}
