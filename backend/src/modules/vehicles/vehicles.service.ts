import { Injectable } from '@nestjs/common';
import {
  DealerStatus,
  FuelType,
  ImageStatus,
  Prisma,
  UserRole,
  Vehicle,
  VehicleStatus,
} from '../../generated/prisma/client';
import { AppConfig } from '../../config/app-config.service';
import { pageArgs, toPage } from '../../common/dto/pagination.dto';
import { Errors } from '../../common/errors/app-error';
import { shortId, slugify } from '../../common/utils/strings';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { CacheNs, CacheService } from '../../infrastructure/cache/cache.service';
import type { Db } from '../../infrastructure/database';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { DealerAccessService, DealerContext } from '../dealers/dealer-access';
import {
  AdminVehicleQueryDto,
  CreateVehicleDto,
  DealerVehicleQueryDto,
  ReserveDto,
  UpdateVehicleDto,
} from './dto/vehicle.dto';
import {
  allowedTargets,
  availabilityOf,
  COMMERCIAL_FIELDS,
  COMMERCIALLY_EDITABLE,
  findTransition,
  FREELY_EDITABLE,
  LifecycleActor,
} from './vehicle-lifecycle';

export interface Actor {
  type: LifecycleActor;
  userId: string | null;
  dealer?: DealerContext;
}

const FUEL_CATEGORY: Partial<Record<FuelType, string>> = {
  ELECTRIC: 'electric-vehicles',
  HYBRID: 'hybrid-vehicles',
  PLUGIN_HYBRID: 'hybrid-vehicles',
};

const SORTS: Record<string, Prisma.VehicleOrderByWithRelationInput[]> = {
  recent: [{ createdAt: 'desc' }],
  'price-asc': [{ price: 'asc' }],
  'price-desc': [{ price: 'desc' }],
  'views-desc': [{ viewCount: 'desc' }],
};

/** Dealer inventory and the vehicle lifecycle (FR-12, FR-47, FR-48, FR-51, BR-01..BR-05). */
@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
    private readonly cache: CacheService,
    private readonly config: AppConfig,
  ) {}

  // ───────────── dealer inventory ─────────────

  async listForDealer(ctx: DealerContext, query: DealerVehicleQueryDto) {
    return this.list({ dealerId: ctx.dealerId, ...DealerAccessService.branchScope(ctx) }, query);
  }

  async listForAdmin(query: AdminVehicleQueryDto) {
    return this.list(query.dealerId ? { dealerId: query.dealerId } : {}, query);
  }

  private async list(scope: Prisma.VehicleWhereInput, query: DealerVehicleQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where: Prisma.VehicleWhereInput = {
      ...scope,
      ...(query.status?.length ? { status: { in: query.status } } : {}),
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { stockNumber: { contains: query.q, mode: 'insensitive' } },
              { vin: { contains: query.q.toUpperCase() } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        orderBy: SORTS[query.sort ?? 'recent'] ?? SORTS.recent,
        skip,
        take,
        include: {
          make: { select: { name: true } },
          model: { select: { name: true } },
          branch: { select: { id: true, name: true } },
          dealer: { select: { id: true, name: true } },
          _count: { select: { leads: true, favourites: true } },
        },
      }),
      this.prisma.vehicle.count({ where }),
    ]);
    return toPage(
      rows.map((row) => ({ ...row, availability: availabilityOf(row.status), allowedActions: allowedTargets(row.status, 'dealer') })),
      total,
      page,
      pageSize,
    );
  }

  async getForDealer(ctx: DealerContext, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, dealerId: ctx.dealerId, ...DealerAccessService.branchScope(ctx) },
      include: this.fullInclude(),
    });
    if (!vehicle) throw Errors.notFound('Vehicle');
    return { ...vehicle, availability: availabilityOf(vehicle.status), allowedTargets: allowedTargets(vehicle.status, 'dealer') };
  }

  async getForAdmin(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id }, include: this.fullInclude() });
    if (!vehicle) throw Errors.notFound('Vehicle');
    return { ...vehicle, availability: availabilityOf(vehicle.status), allowedTargets: allowedTargets(vehicle.status, 'admin') };
  }

  private fullInclude() {
    return {
      make: true,
      model: true,
      generation: true,
      variant: { include: { specification: true } },
      branch: true,
      categories: true,
      images: { orderBy: [{ isPrimary: 'desc' as const }, { position: 'asc' as const }] },
      featureAssignments: { include: { feature: true } },
      statusHistory: { orderBy: { createdAt: 'desc' as const }, take: 50 },
      priceHistory: { orderBy: { createdAt: 'desc' as const }, take: 50 },
    } satisfies Prisma.VehicleInclude;
  }

  async create(ctx: DealerContext, dto: CreateVehicleDto) {
    const catalogue = await this.resolveCatalogue(dto);
    const branch = dto.branchId ? await this.ownBranch(ctx, dto.branchId) : null;
    if (!ctx.wideScope && ctx.branchId && dto.branchId && dto.branchId !== ctx.branchId) {
      throw Errors.forbidden('BRANCH_SCOPE', 'You can only add vehicles to your own branch');
    }
    const dealer = await this.prisma.dealer.findUniqueOrThrow({ where: { id: ctx.dealerId } });
    const spec = catalogue.variant?.specification;
    const transmission = dto.transmission ?? spec?.transmission;
    const fuelType = dto.fuelType ?? spec?.fuelType;
    if (!transmission || !fuelType) {
      throw Errors.badRequest('SPEC_REQUIRED', 'transmission and fuelType are required when no catalogue variant provides them');
    }
    const title = dto.title ?? [dto.year, catalogue.make.name, catalogue.model.name, catalogue.variant?.name].filter(Boolean).join(' ');
    const categoryIds = await this.autoCategories(dto.categoryIds ?? [], catalogue, fuelType);

    const vehicle = await this.prisma.$transaction(async (tx) => {
      const created = await tx.vehicle.create({
        data: {
          dealerId: ctx.dealerId,
          branchId: branch?.id ?? (ctx.wideScope ? null : ctx.branchId),
          makeId: dto.makeId,
          modelId: dto.modelId,
          generationId: dto.generationId ?? catalogue.variant?.generationId ?? null,
          variantId: dto.variantId,
          slug: `${slugify(title)}-${shortId()}`,
          title,
          description: dto.description,
          stockNumber: dto.stockNumber,
          condition: dto.condition,
          year: dto.year,
          mileage: dto.mileage,
          price: dto.price,
          specialPrice: dto.specialPrice,
          isSpecial: dto.isSpecial ?? false,
          promotionId: dto.promotionId,
          transmission,
          fuelType,
          drivetrain: dto.drivetrain ?? spec?.drivetrain,
          colour: dto.colour,
          engineCapacityCc: dto.engineCapacityCc ?? spec?.engineCapacityCc,
          powerKw: dto.powerKw ?? spec?.powerKw,
          cylinders: dto.cylinders ?? spec?.cylinders,
          seats: dto.seats ?? spec?.seats,
          doors: dto.doors ?? spec?.doors,
          vin: dto.vin,
          registrationNumber: dto.registrationNumber,
          province: dto.province ?? branch?.province ?? dealer.province,
          city: dto.city ?? branch?.city ?? dealer.city,
          latitude: dto.latitude ?? branch?.latitude,
          longitude: dto.longitude ?? branch?.longitude,
          status: VehicleStatus.DRAFT,
          createdById: ctx.userId,
          categories: { connect: categoryIds.map((id) => ({ id })) },
        },
      });
      if (dto.featureIds?.length) {
        await tx.featureAssignment.createMany({ data: dto.featureIds.map((featureId) => ({ featureId, vehicleId: created.id })) });
      }
      await tx.vehicleStatusHistory.create({ data: { vehicleId: created.id, toStatus: VehicleStatus.DRAFT, actorId: ctx.userId } });
      await this.audit.record({ action: 'vehicle.create', entityType: 'vehicle', entityId: created.id, after: created }, tx);
      return created;
    });
    return this.getForDealer(ctx, vehicle.id);
  }

  async update(ctx: DealerContext, id: string, dto: UpdateVehicleDto) {
    const current = await this.prisma.vehicle.findFirst({ where: { id, dealerId: ctx.dealerId, ...DealerAccessService.branchScope(ctx) } });
    if (!current) throw Errors.notFound('Vehicle');
    await this.applyUpdate(current, dto, { type: 'dealer', userId: ctx.userId, dealer: ctx });
    return this.getForDealer(ctx, id);
  }

  async applyUpdate(current: Vehicle, dto: UpdateVehicleDto, actor: Actor) {
    const { expectedVersion, featureIds, categoryIds, ...fields } = dto;
    if (expectedVersion !== undefined && expectedVersion !== current.version) {
      throw Errors.conflict('STALE_VERSION', 'This vehicle was changed by someone else; reload and try again', { currentVersion: current.version });
    }

    const changedKeys = Object.keys(dto).filter((key) => key !== 'expectedVersion' && (dto as Record<string, unknown>)[key] !== undefined);
    if (FREELY_EDITABLE.includes(current.status)) {
      // anything goes before review
    } else if (COMMERCIALLY_EDITABLE.includes(current.status)) {
      const material = changedKeys.filter((key) => !(COMMERCIAL_FIELDS as readonly string[]).includes(key));
      if (material.length) {
        throw Errors.conflict(
          'MATERIAL_CHANGE_REQUIRES_REVIEW',
          `Changing ${material.join(', ')} requires moving the vehicle back to draft and a new review`,
          { fields: material },
        );
      }
    } else {
      throw Errors.conflict('VEHICLE_NOT_EDITABLE', `A vehicle in ${current.status} cannot be edited`);
    }

    if (fields.makeId || fields.modelId || fields.variantId || fields.generationId) {
      await this.resolveCatalogue({
        makeId: fields.makeId ?? current.makeId,
        modelId: fields.modelId ?? current.modelId,
        variantId: fields.variantId ?? current.variantId ?? undefined,
        generationId: fields.generationId ?? current.generationId ?? undefined,
      });
    }
    if (fields.branchId && actor.dealer) await this.ownBranch(actor.dealer, fields.branchId);
    const nextPrice = fields.price ?? current.price;
    const nextSpecial = fields.specialPrice ?? current.specialPrice;
    if ((fields.isSpecial ?? current.isSpecial) && nextSpecial && nextSpecial >= nextPrice) {
      throw Errors.badRequest('INVALID_SPECIAL_PRICE', 'specialPrice must be lower than price');
    }

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.vehicle.updateMany({
        where: { id: current.id, version: current.version, status: current.status },
        data: { ...fields, version: { increment: 1 } },
      });
      if (updated.count !== 1) throw Errors.conflict('CONCURRENT_UPDATE', 'The vehicle changed while you were editing; reload and retry');

      if (categoryIds) {
        await tx.vehicle.update({ where: { id: current.id }, data: { categories: { set: categoryIds.map((categoryId) => ({ id: categoryId })) } } });
      }
      if (featureIds) {
        await tx.featureAssignment.deleteMany({ where: { vehicleId: current.id } });
        if (featureIds.length) await tx.featureAssignment.createMany({ data: featureIds.map((featureId) => ({ featureId, vehicleId: current.id })) });
      }
      if (fields.price !== undefined && fields.price !== current.price) {
        await tx.vehiclePriceHistory.create({ data: { vehicleId: current.id, oldPrice: current.price, newPrice: fields.price, changedById: actor.userId } });
        if (current.status === VehicleStatus.PUBLISHED || current.status === VehicleStatus.RESERVED) {
          await this.outbox.enqueue(tx, {
            type: OutboxEvents.VehiclePriceChanged,
            aggregateType: 'vehicle',
            aggregateId: current.id,
            payload: { vehicleId: current.id, oldPrice: current.price, newPrice: fields.price },
          });
        }
      }
      const after = await tx.vehicle.findUniqueOrThrow({ where: { id: current.id } });
      await this.audit.record({ action: 'vehicle.update', entityType: 'vehicle', entityId: current.id, before: current, after }, tx);
    });
    await this.invalidate(current.status);
  }

  // ───────────── lifecycle ─────────────

  /** Single entry point for every status change, from dealers, admins and background jobs. */
  async transition(
    vehicleId: string,
    to: VehicleStatus,
    actor: Actor,
    options: { reason?: string; reservedUntil?: Date; action?: string } = {},
  ) {
    const current = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { dealer: { select: { status: true } }, images: { select: { status: true } } },
    });
    if (!current) throw Errors.notFound('Vehicle');
    if (actor.dealer) {
      const inScope = current.dealerId === actor.dealer.dealerId &&
        (actor.dealer.wideScope || !actor.dealer.branchId || current.branchId === actor.dealer.branchId);
      if (!inScope) throw Errors.notFound('Vehicle');
    }

    const rule = findTransition(current.status, to, actor.type);
    if (!rule || (options.action && rule.action !== options.action)) {
      throw Errors.conflict('INVALID_STATUS_TRANSITION', `Cannot move a vehicle from ${current.status} to ${to}`, {
        allowed: allowedTargets(current.status, actor.type),
      });
    }
    await this.assertBusinessRules(current, rule.action, actor, options);

    const now = new Date();
    const data: Prisma.VehicleUpdateManyMutationInput = { status: to, version: { increment: 1 } };
    switch (rule.action) {
      case 'submit':
        Object.assign(data, { submittedAt: now, reviewNotes: null });
        break;
      case 'approve':
        Object.assign(data, { approvedAt: now, reviewNotes: options.reason ?? null });
        break;
      case 'reject':
        Object.assign(data, { reviewNotes: options.reason });
        break;
      case 'edit':
        Object.assign(data, { approvedAt: null });
        break;
      case 'publish':
        // keep the first publication date so re-publishing cannot jump to the top of "newest"
        Object.assign(data, { publishedAt: current.publishedAt ?? now });
        break;
      case 'reserve': {
        const hold = this.config.get('RESERVATION_HOLD_HOURS');
        Object.assign(data, { reservedAt: now, reservedUntil: options.reservedUntil ?? new Date(now.getTime() + hold * 3600_000) });
        break;
      }
      case 'release':
        Object.assign(data, { reservedAt: null, reservedUntil: null });
        break;
      case 'sell':
        Object.assign(data, { soldAt: now, reservedUntil: null });
        break;
      case 'archive':
        Object.assign(data, { archivedAt: now });
        break;
      case 'relist':
        Object.assign(data, { soldAt: null });
        break;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.vehicle.updateMany({ where: { id: vehicleId, status: current.status }, data });
      if (result.count !== 1) throw Errors.conflict('CONCURRENT_UPDATE', 'The vehicle status changed meanwhile; reload and retry');
      await tx.vehicleStatusHistory.create({
        data: { vehicleId, fromStatus: current.status, toStatus: to, actorId: actor.userId, reason: options.reason },
      });
      await this.audit.record(
        {
          action: `vehicle.${rule.action}`,
          entityType: 'vehicle',
          entityId: vehicleId,
          before: { status: current.status },
          after: { status: to, reason: options.reason },
          ...(actor.type === 'system' ? { actorId: null, actorRole: 'SYSTEM' } : {}),
        },
        tx,
      );
      await this.outbox.enqueue(tx, {
        type: OutboxEvents.VehicleStatusChanged,
        aggregateType: 'vehicle',
        aggregateId: vehicleId,
        payload: { vehicleId, dealerId: current.dealerId, from: current.status, to, action: rule.action, reason: options.reason ?? null, actorType: actor.type },
      });
      return tx.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
    });
    await this.invalidate(current.status, to);
    return { ...updated, availability: availabilityOf(updated.status) };
  }

  private async assertBusinessRules(
    current: Vehicle & { dealer: { status: DealerStatus }; images: { status: ImageStatus }[] },
    action: string,
    actor: Actor,
    options: { reason?: string; reservedUntil?: Date },
  ) {
    if ((action === 'submit' || action === 'publish' || action === 'unsuspend') && current.dealer.status !== DealerStatus.APPROVED) {
      throw Errors.forbidden('DEALER_NOT_APPROVED', 'Only approved dealers can submit or publish listings (BR-02)');
    }
    if (action === 'submit') {
      const usable = current.images.filter((image) => image.status === ImageStatus.READY || image.status === ImageStatus.PROCESSING);
      if (!usable.length) throw Errors.unprocessable('IMAGES_REQUIRED', 'Upload at least one photo before submitting for review');
    }
    if (action === 'reject' && !options.reason) {
      throw Errors.badRequest('REASON_REQUIRED', 'A reason is required when rejecting a listing');
    }
    if (action === 'suspend' && actor.type === 'admin' && !options.reason) {
      throw Errors.badRequest('REASON_REQUIRED', 'A reason is required when an administrator suspends a listing');
    }
    if (action === 'unsuspend' && actor.type === 'dealer') {
      const lastSuspension = await this.prisma.vehicleStatusHistory.findFirst({
        where: { vehicleId: current.id, toStatus: VehicleStatus.SUSPENDED },
        orderBy: { createdAt: 'desc' },
      });
      if (lastSuspension?.actorId) {
        const suspender = await this.prisma.user.findUnique({ where: { id: lastSuspension.actorId }, select: { role: true } });
        if (suspender && (suspender.role === UserRole.ADMIN || suspender.role === UserRole.SUPER_ADMIN)) {
          throw Errors.forbidden('ADMIN_SUSPENSION', 'This listing was suspended by an administrator and can only be reinstated by one');
        }
      }
    }
    if (action === 'reserve' && options.reservedUntil && options.reservedUntil <= new Date()) {
      throw Errors.badRequest('INVALID_RESERVATION', 'reservedUntil must be in the future');
    }
  }

  reserve(ctx: DealerContext, id: string, dto: ReserveDto) {
    return this.transition(id, VehicleStatus.RESERVED, { type: 'dealer', userId: ctx.userId, dealer: ctx }, {
      action: 'reserve',
      reason: dto.reason,
      reservedUntil: dto.reservedUntil ? new Date(dto.reservedUntil) : undefined,
    });
  }

  async setAdminFlags(id: string, flags: { isFeatured?: boolean; isSpecial?: boolean }) {
    const before = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!before) throw Errors.notFound('Vehicle');
    const after = await this.prisma.vehicle.update({ where: { id }, data: { ...flags, version: { increment: 1 } } });
    await this.audit.record({ action: 'vehicle.admin_flags', entityType: 'vehicle', entityId: id, before: { isFeatured: before.isFeatured, isSpecial: before.isSpecial }, after: flags });
    await this.invalidate(before.status);
    return after;
  }

  /** Review queue for administrators (BR-01): oldest submissions first. */
  async reviewQueue(query: { page?: number; pageSize?: number }) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where = { status: VehicleStatus.PENDING_REVIEW };
    const [rows, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        orderBy: { submittedAt: 'asc' },
        skip,
        take,
        include: { dealer: { select: { id: true, name: true, status: true } }, make: { select: { name: true } }, model: { select: { name: true } }, images: { take: 1, orderBy: { position: 'asc' } } },
      }),
      this.prisma.vehicle.count({ where }),
    ]);
    return toPage(rows, total, page, pageSize);
  }

  // ───────────── helpers ─────────────

  /** Public listings change only when a publicly visible state is involved. */
  async invalidate(...statuses: VehicleStatus[]) {
    const publicStates: VehicleStatus[] = [VehicleStatus.PUBLISHED, VehicleStatus.RESERVED, VehicleStatus.SOLD];
    if (statuses.some((status) => publicStates.includes(status))) await this.cache.bump(CacheNs.vehicles);
  }

  private async ownBranch(ctx: DealerContext, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, dealerId: ctx.dealerId, isActive: true } });
    if (!branch) throw Errors.badRequest('INVALID_BRANCH', 'Branch does not belong to your dealership');
    return branch;
  }

  /** Validates the make/model/generation/variant chain (NFR-10 data integrity). */
  async resolveCatalogue(dto: { makeId: string; modelId: string; generationId?: string; variantId?: string }, db: Db = this.prisma) {
    const model = await db.model.findUnique({ where: { id: dto.modelId }, include: { make: true } });
    if (!model || model.makeId !== dto.makeId) throw Errors.badRequest('MODEL_MAKE_MISMATCH', 'Model does not belong to the selected make');
    let variant = null;
    if (dto.variantId) {
      variant = await db.variant.findUnique({ where: { id: dto.variantId }, include: { specification: true } });
      if (!variant || variant.modelId !== dto.modelId) throw Errors.badRequest('VARIANT_MODEL_MISMATCH', 'Variant does not belong to the selected model');
    }
    if (dto.generationId) {
      const generation = await db.generation.findUnique({ where: { id: dto.generationId } });
      if (!generation || generation.modelId !== dto.modelId) throw Errors.badRequest('GENERATION_MODEL_MISMATCH', 'Generation does not belong to the selected model');
    }
    return { make: model.make, model, variant };
  }

  private async autoCategories(
    explicit: string[],
    catalogue: { model: { defaultCategoryId: string | null }; variant: { bodyCategoryId: string | null } | null },
    fuelType: FuelType,
  ): Promise<string[]> {
    const ids = new Set(explicit);
    const body = catalogue.variant?.bodyCategoryId ?? catalogue.model.defaultCategoryId;
    if (body) ids.add(body);
    const fuelSlug = FUEL_CATEGORY[fuelType];
    if (fuelSlug) {
      const category = await this.prisma.category.findUnique({ where: { slug: fuelSlug }, select: { id: true } });
      if (category) ids.add(category.id);
    }
    if (explicit.length) {
      const found = await this.prisma.category.count({ where: { id: { in: explicit } } });
      if (found !== new Set(explicit).size) throw Errors.badRequest('INVALID_CATEGORY', 'One or more categories do not exist');
    }
    return [...ids];
  }
}
