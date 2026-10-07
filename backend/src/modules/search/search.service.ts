import { Injectable, Logger, Module, OnModuleInit } from '@nestjs/common';
import { VehicleStatus } from '../../generated/prisma/client';
import { toPage } from '../../common/dto/pagination.dto';
import { CacheNs, CacheService } from '../../infrastructure/cache/cache.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { NotificationTypes } from '../notifications/notification-types';
import { NotificationsService } from '../notifications/notifications.service';
import { publicVehicleSelect, withAvailability } from '../vehicles/vehicle.presenter';
import { SearchCriteriaDto, SearchVehiclesQueryDto } from './dto/search.dto';
import { buildOrderBy, buildWhere, criteriaKey } from './search.builder';
import { matchesCriteria, VehicleSnapshot } from './search.matcher';

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

  /** Filter counts for the current search (FR-05 "filter based on available criteria"). */
  async facets(criteria: SearchCriteriaDto) {
    const key = await this.cache.versionedKey(CacheNs.vehicles, `facets:${criteriaKey(criteria)}`);
    return this.cache.wrap(key, FACETS_TTL_SECONDS, async () => {
      const where = buildWhere(criteria);
      const db = this.prisma.replica;
      const [makes, fuel, transmission, province, condition, ranges, categories] = await Promise.all([
        db.vehicle.groupBy({ by: ['makeId'], where, _count: { _all: true } }),
        db.vehicle.groupBy({ by: ['fuelType'], where, _count: { _all: true } }),
        db.vehicle.groupBy({ by: ['transmission'], where, _count: { _all: true } }),
        db.vehicle.groupBy({ by: ['province'], where, _count: { _all: true } }),
        db.vehicle.groupBy({ by: ['condition'], where, _count: { _all: true } }),
        db.vehicle.aggregate({ where, _min: { price: true, year: true, mileage: true }, _max: { price: true, year: true, mileage: true } }),
        db.category.findMany({ where: { isActive: true }, select: { id: true, slug: true, name: true }, orderBy: { sortOrder: 'asc' } }),
      ]);
      const makeRows = await db.make.findMany({ where: { id: { in: makes.map((row) => row.makeId) } }, select: { id: true, slug: true, name: true } });
      const categoryCounts = await Promise.all(
        categories.map(async (category) => ({
          slug: category.slug,
          name: category.name,
          count: await db.vehicle.count({ where: { AND: [where, { categories: { some: { id: category.id } } }] } }),
        })),
      );
      return {
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

