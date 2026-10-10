import { Injectable, Logger, Module, OnModuleInit } from '@nestjs/common';
import { VehicleStatus } from '../../generated/prisma/client';
import { toPage } from '../../common/dto/pagination.dto';
import { Errors } from '../../common/errors/app-error';
import { CacheNs, CacheService } from '../../infrastructure/cache/cache.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { NotificationTypes } from '../notifications/notification-types';
import { NotificationsService } from '../notifications/notifications.service';
import { publicVehicleSelect, withAvailability } from '../vehicles/vehicle.presenter';
import { SearchCriteriaDto, SearchVehiclesQueryDto } from './dto/search.dto';
import { buildOrderBy, buildWhere, criteriaKey, haversineKm } from './search.builder';
import { matchesCriteria, VehicleSnapshot } from './search.matcher';
import { buildFilterData, filterVehicleSelect } from './filter-data';

const SEARCH_TTL_SECONDS = 30;
const FACETS_TTL_SECONDS = 120;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Public vehicle search (brief section 8). Starts on PostgreSQL with targeted indexes and reads
 * from the replica; results are cached briefly and invalidated by namespace bump on listing changes.
 * The query contract (SearchVehiclesQueryDto) is engine-agnostic so this service can move to
 * OpenSearch later without changing the API. Search results are a projection: transactional
 * actions (enquiries, offers) always re-validate against the primary database.
 */
@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async search(query: SearchVehiclesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const key = await this.cache.versionedKey(CacheNs.vehicles, `search:${criteriaKey(query)}`);
    if (query.sort === 'nearest') {
      if (query.lat === undefined || query.lng === undefined) throw Errors.badRequest('VALIDATION_FAILED', 'Request validation failed', ['sort=nearest needs lat and lng']);
      return this.cache.wrap(key, SEARCH_TTL_SECONDS, () => this.searchNearest(query, query.lat!, query.lng!, page, pageSize));
    }
    return this.cache.wrap(key, SEARCH_TTL_SECONDS, async () => {
      const where = buildWhere(query);
      const [rows, total] = await Promise.all([
        this.prisma.replica.vehicle.findMany({
          where,
          select: publicVehicleSelect,
          orderBy: buildOrderBy(query.sort, query.collection),
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.replica.vehicle.count({ where }),
      ]);
      return toPage(rows.map(withAvailability), total, page, pageSize);
    });
  }

  /**
   * "Near Me": closest first by straight-line distance, each result carrying `distanceKm`.
   * With radiusKm only vehicles inside the exact radius are returned; without it, vehicles
   * with no location follow the located ones, newest first.
   */
  private async searchNearest(query: SearchVehiclesQueryDto, lat: number, lng: number, page: number, pageSize: number) {
    const where = buildWhere(query);
    const points = await this.prisma.replica.vehicle.findMany({ where, select: { id: true, latitude: true, longitude: true }, orderBy: buildOrderBy('nearest') });
    const located: { id: string; distanceKm: number }[] = [];
    const unlocated: string[] = [];
    for (const point of points) {
      if (point.latitude === null || point.longitude === null) {
        if (!query.radiusKm) unlocated.push(point.id);
        continue;
      }
      const distanceKm = haversineKm(lat, lng, point.latitude, point.longitude);
      if (!query.radiusKm || distanceKm <= query.radiusKm) located.push({ id: point.id, distanceKm });
    }
    located.sort((a, b) => a.distanceKm - b.distanceKm || b.id.localeCompare(a.id));

    const ordered = [...located.map((item) => item.id), ...unlocated];
    const pageIds = ordered.slice((page - 1) * pageSize, page * pageSize);
    const rows = await this.prisma.replica.vehicle.findMany({ where: { id: { in: pageIds } }, select: publicVehicleSelect });
    const byId = new Map(rows.map((row) => [row.id, row]));
    const distances = new Map(located.map((item) => [item.id, Math.round(item.distanceKm * 10) / 10]));
    const data = pageIds.flatMap((id) => {
      const row = byId.get(id);
      return row ? [{ ...withAvailability(row), distanceKm: distances.get(id) ?? null }] : [];
    });
    return toPage(data, ordered.length, page, pageSize);
  }

  /**
   * Fast count of vehicles matching search criteria (FR-02, FR-05) for dynamic hero/filter counters.
   * Returns total matching rows without loading individual vehicle data.
   */
  async count(criteria: SearchCriteriaDto) {
    const key = await this.cache.versionedKey(CacheNs.vehicles, `count:${criteriaKey(criteria)}`);
    return this.cache.wrap(key, SEARCH_TTL_SECONDS, async () => {
      const where = buildWhere(criteria);
      const total = await this.prisma.replica.vehicle.count({ where });
      return {
        total,
        count: total,
        formatted: total.toLocaleString('en-US').replace(/,/g, ' '),
      };
    });
  }

  /** Complete unpaginated public snapshot for app-side dependent filtering. */
  async allFilterData() {
    const key = await this.cache.versionedKey(CacheNs.vehicles, 'filters:all:v1');
    return this.cache.wrap(key, FACETS_TTL_SECONDS, async () => {
      const rows = await this.prisma.replica.vehicle.findMany({
        where: buildWhere({}),
        select: filterVehicleSelect,
        orderBy: { id: 'asc' },
      });
      return buildFilterData(rows);
    });
  }

  /** Filter counts for the current search (FR-05 "filter based on available criteria"). */
  async facets(criteria: SearchCriteriaDto) {
    const key = await this.cache.versionedKey(CacheNs.vehicles, `facets:${criteriaKey(criteria)}`);
    return this.cache.wrap(key, FACETS_TTL_SECONDS, async () => {
      const where = buildWhere(criteria);
      const db = this.prisma.replica;
      const [makes, fuel, transmission, province, condition, ranges, categories, models, variants, colours, cities, drives, total, seats, engines, powers, dealers] = await Promise.all([
        db.vehicle.groupBy({ by: ['makeId'], where, _count: { _all: true } }),
        db.vehicle.groupBy({ by: ['fuelType'], where, _count: { _all: true } }),
        db.vehicle.groupBy({ by: ['transmission'], where, _count: { _all: true } }),
        db.vehicle.groupBy({ by: ['province'], where, _count: { _all: true } }),
        db.vehicle.groupBy({ by: ['condition'], where, _count: { _all: true } }),
        db.vehicle.aggregate({ where, _min: { price: true, year: true, mileage: true }, _max: { price: true, year: true, mileage: true } }),
        db.category.findMany({ where: { isActive: true }, select: { id: true, slug: true, name: true }, orderBy: { sortOrder: 'asc' } }),
        db.vehicle.groupBy({ by: ['modelId'], where, _count: { _all: true } }),
        db.vehicle.groupBy({ by: ['variantId'], where, _count: { _all: true } }),
        db.vehicle.groupBy({ by: ['colour'], where, _count: { _all: true } }),
        db.vehicle.groupBy({ by: ['city'], where, _count: { _all: true } }),
        db.vehicle.groupBy({ by: ['drivetrain'], where, _count: { _all: true } }),
        db.vehicle.count({ where }),
        db.vehicle.groupBy({ by: ['seats'], where, _count: { _all: true } }),
        db.vehicle.groupBy({ by: ['engineCapacityCc'], where, _count: { _all: true } }),
        db.vehicle.groupBy({ by: ['powerKw'], where, _count: { _all: true } }),
        db.vehicle.groupBy({ by: ['dealerId'], where, _count: { _all: true } }),
      ]);
      const makeRows = await db.make.findMany({ where: { id: { in: makes.map((row) => row.makeId) } }, select: { id: true, slug: true, name: true } });
      const [modelRows, variantRows] = await Promise.all([
        db.model.findMany({ where: { id: { in: models.map((row) => row.modelId) } }, select: { id: true, slug: true, name: true, make: { select: { slug: true } } } }),
        db.variant.findMany({ where: { id: { in: variants.flatMap((row) => row.variantId ? [row.variantId] : []) } }, select: { id: true, slug: true, name: true, model: { select: { slug: true, make: { select: { slug: true } } } } } }),
      ]);
      const dealerRows = await db.dealer.findMany({ where: { id: { in: dealers.map((row) => row.dealerId) } }, select: { id: true, slug: true, name: true } });
      const colourCounts = new Map<string, number>();
      for (const row of colours) {
        const value = row.colour?.trim().toLowerCase();
        if (value) colourCounts.set(value, (colourCounts.get(value) ?? 0) + row._count._all);
      }
      const categoryCounts = await Promise.all(
        categories.map(async (category) => ({
          slug: category.slug,
          name: category.name,
          count: await db.vehicle.count({ where: { AND: [where, { categories: { some: { id: category.id } } }] } }),
        })),
      );
      return {
        total,
        seats: seats.flatMap((row) => row.seats === null ? [] : [{ value: row.seats, count: row._count._all }]).sort((a, b) => a.value - b.value),
        engineCapacityCc: engines.flatMap((row) => row.engineCapacityCc === null ? [] : [{ value: row.engineCapacityCc, count: row._count._all }]).sort((a, b) => a.value - b.value),
        powerKw: powers.flatMap((row) => row.powerKw === null ? [] : [{ value: row.powerKw, count: row._count._all }]).sort((a, b) => a.value - b.value),
        dealerships: dealers.flatMap((row) => {
          const dealer = dealerRows.find((item) => item.id === row.dealerId);
          return dealer ? [{ slug: dealer.slug, name: dealer.name, count: row._count._all }] : [];
        }).sort((a, b) => a.name.localeCompare(b.name)),
        models: models.flatMap((row) => {
          const model = modelRows.find((item) => item.id === row.modelId);
          return model ? [{ slug: model.slug, name: model.name, make: model.make.slug, value: `${model.make.slug}:${model.slug}`, count: row._count._all }] : [];
        }).sort((a, b) => a.name.localeCompare(b.name)),
        variants: variants.flatMap((row) => {
          const variant = variantRows.find((item) => item.id === row.variantId);
          return variant ? [{ slug: variant.slug, name: variant.name, make: variant.model.make.slug, model: variant.model.slug, count: row._count._all }] : [];
        }).sort((a, b) => a.name.localeCompare(b.name)),
        colour: [...colourCounts].map(([value, count]) => ({ value, name: value.replace(/\b\w/g, (letter) => letter.toUpperCase()), count })).sort((a, b) => a.name.localeCompare(b.name)),
        city: cities.filter((row) => row.city).map((row) => ({ value: row.city, count: row._count._all })),
        drivetrain: drives.filter((row) => row.drivetrain).map((row) => ({ value: row.drivetrain, count: row._count._all })),
        makes: makes
          .map((row) => {
            const make = makeRows.find((item) => item.id === row.makeId);
            return { slug: make?.slug, name: make?.name, count: row._count._all };
          })
          .sort((a, b) => b.count - a.count),
        fuelType: fuel.map((row) => ({ value: row.fuelType, count: row._count._all })),
        transmission: transmission.map((row) => ({ value: row.transmission, count: row._count._all })),
        province: province.map((row) => ({ value: row.province, count: row._count._all })),
        condition: condition.map((row) => ({ value: row.condition, count: row._count._all })),
        categories: categoryCounts.filter((row) => row.count > 0),
        ranges: { price: { min: ranges._min.price, max: ranges._max.price }, year: { min: ranges._min.year, max: ranges._max.year }, mileage: { min: ranges._min.mileage, max: ranges._max.mileage } },
      };
    });
  }

  /** Loads the matcher snapshot for one vehicle. */
  async snapshot(vehicleId: string): Promise<VehicleSnapshot | null> {
    const row = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        make: { select: { slug: true } },
        model: { select: { slug: true } },
        variant: { select: { slug: true } },
        dealer: { select: { slug: true } },
        categories: { select: { slug: true } },
      },
    });
    if (!row) return null;
    return {
      status: row.status,
      title: row.title,
      makeSlug: row.make.slug,
      modelSlug: row.model.slug,
      variantSlug: row.variant?.slug ?? null,
      condition: row.condition,
      fuelType: row.fuelType,
      transmission: row.transmission,
      drivetrain: row.drivetrain,
      province: row.province,
      city: row.city,
      colour: row.colour,
      dealerSlug: row.dealer.slug,
      branchId: row.branchId,
      categorySlugs: row.categories.map((category) => category.slug),
      price: row.price,
      year: row.year,
      mileage: row.mileage,
      engineCapacityCc: row.engineCapacityCc,
      powerKw: row.powerKw,
      seats: row.seats,
      isSpecial: row.isSpecial,
      isFeatured: row.isFeatured,
      popularityScore: row.popularityScore,
      publishedAt: row.publishedAt,
      latitude: row.latitude,
      longitude: row.longitude,
    };
  }
}

/**
 * FR-39 search alerts: new matching vehicle, price drop, back-in-stock. Runs in the worker and
 * walks saved searches in batches, so cost grows linearly and never blocks a request.
 */
@Injectable()
export class SearchAlertHandlers implements OnModuleInit {
  private readonly logger = new Logger(SearchAlertHandlers.name);

  constructor(
    private readonly outbox: OutboxService,
    private readonly prisma: PrismaService,
    private readonly search: SearchService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    this.outbox.on(OutboxEvents.VehicleStatusChanged, 'search.saved-search-alerts', async (event) => {
      const { vehicleId, action } = event.payload;
      // New listing, or back on sale after a reservation/suspension (availability alert).
      if (!['publish', 'release', 'unsuspend', 'relist'].includes(action)) return;
      await this.alert(vehicleId, action === 'publish' ? 'new' : 'available');
    });

    this.outbox.on(OutboxEvents.VehiclePriceChanged, 'search.price-drop-alerts', async (event) => {
      if (event.payload.newPrice < event.payload.oldPrice) await this.alert(event.payload.vehicleId, 'price-drop', { oldPrice: event.payload.oldPrice, newPrice: event.payload.newPrice });
    });
  }

  private async alert(vehicleId: string, kind: 'new' | 'available' | 'price-drop', price?: { oldPrice: number; newPrice: number }) {
    const vehicle = await this.search.snapshot(vehicleId);
    if (!vehicle || vehicle.status !== VehicleStatus.PUBLISHED) return;
    const slug = (await this.prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { slug: true } }))?.slug;

    let cursor: string | undefined;
    const notified = new Set<string>();
    for (;;) {
      const batch = await this.prisma.savedSearch.findMany({
        where: { alertsEnabled: true },
        orderBy: { id: 'asc' },
        take: 1000,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: { id: true, userId: true, name: true, criteria: true },
      });
      if (!batch.length) break;
      cursor = batch[batch.length - 1].id;

      const matches = batch.filter((saved) => !notified.has(saved.userId) && matchesCriteria(vehicle, saved.criteria as SearchCriteriaDto));
      for (const saved of matches) {
        notified.add(saved.userId);
        const body =
          kind === 'new'
            ? `New match for "${saved.name}": ${vehicle.title}`
            : kind === 'available'
              ? `${vehicle.title} matching "${saved.name}" is available again`
              : `${vehicle.title} matching "${saved.name}" dropped to R${price!.newPrice.toLocaleString('en-ZA')}`;
        await this.notifications.notify({
          userIds: [saved.userId],
          type: NotificationTypes.SavedSearchMatch,
          title: kind === 'price-drop' ? 'Price drop on a saved search' : 'New vehicle for your saved search',
          body,
          data: { vehicleId, slug, savedSearchId: saved.id, kind },
        });
      }
      if (matches.length) {
        await this.prisma.savedSearch.updateMany({ where: { id: { in: matches.map((saved) => saved.id) } }, data: { lastAlertedAt: new Date() } });
      }
      if (batch.length < 1000) break;
    }
    if (notified.size) this.logger.log(`Saved-search ${kind} alert for ${vehicleId} sent to ${notified.size} users`);
  }
}

@Module({
  providers: [SearchService, SearchAlertHandlers],
  exports: [SearchService],
})
export class SearchModule {}

