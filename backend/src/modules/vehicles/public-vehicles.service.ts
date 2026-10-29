import { standardColourId } from './standard-colours';
import { buildWhere } from '../search/search.builder';
import { SearchCriteriaDto } from '../search/dto/search.dto';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, VehicleStatus } from '../../generated/prisma/client';
import { Errors } from '../../common/errors/app-error';
import { listingSlugFilter, splitCsv } from '../../common/utils/strings';
import { CacheNs, CacheService } from '../../infrastructure/cache/cache.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { REDIS, RedisClient } from '../../infrastructure/redis/redis.module';
import { CatalogueService } from '../catalogue/catalogue.service';
import { financeExample } from '../finance/finance.calculator';
import { PUBLIC_DETAIL_STATUSES, PUBLIC_SEARCH_STATUSES } from './vehicle-lifecycle';
import { effectivePrice, publicVehicleDetailSelect, publicVehicleSelect, withAvailability } from './vehicle.presenter';
import { detailColour, dealerTradeColourId } from './detail-colour';
import { DealerTradeStockService } from '../../infrastructure/dealertrade/dealertrade-stock.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VIEWS_KEY = 'cc:views:pending';
const RECENTLY_VIEWED_LIMIT = 50;
export const POPULARITY = { enquiry: 20, favourite: 10 } as const;

@Injectable()
export class PublicVehiclesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PublicVehiclesService.name);
  private readonly memoryViews = new Map<string, number>();
  private memoryFlushTimer: NodeJS.Timeout | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly catalogue: CatalogueService,
    @Inject(REDIS) private readonly redis: RedisClient,
    private readonly stock: DealerTradeStockService,
  ) {}

  /** Live DealerTrade stock counts (see DealerTradeStockService). */
  sourceSummary() {
    return this.stock.summary();
  }

  /** Supplier total for the combined button; filtered counts remain local matches. */
  async searchButtonCount(criteria: SearchCriteriaDto, localTotal: number) {
    const source = await this.sourceSummary();
    const now = new Date();
    const unfiltered = JSON.stringify(buildWhere(criteria, now)) === JSON.stringify(buildWhere({}, now));
    const total = unfiltered ? source.total_stock_count ?? localTotal : localTotal;
    return { total, count: total, searchCount: total, localTotal,
      formatted: total.toLocaleString('en-US').replace(/,/g, ' '), source };
  }

  /**
   * Without Redis, views are counted in this process's memory, which a separate worker process
   * cannot read. So the process that counted them saves them itself (with Redis the worker does it).
   */
  onModuleInit(): void {
    if (this.redis) return;
    this.memoryFlushTimer = setInterval(() => {
      this.flushViews().catch((error) => this.logger.warn(`view flush failed: ${(error as Error).message}`));
    }, 30_000);
    this.memoryFlushTimer.unref();
  }

  async onModuleDestroy(): Promise<void> {
    clearInterval(this.memoryFlushTimer);
    if (!this.redis) await this.flushViews().catch(() => undefined);
  }

  /** Overlay user state after shared caching, reading primary for immediate save/remove visibility. */
  async withFavouriteFlags<T extends { id: string }>(rows: T[], userId?: string) {
    const saved = userId && rows.length ? await this.prisma.favourite.findMany({
      where: { userId, vehicleId: { in: [...new Set(rows.map((row) => row.id))] } },
      select: { vehicleId: true },
    }) : [];
    const ids = new Set(saved.map((row) => row.vehicleId));
    return rows.map((row) => ({ ...row, isFavourite: ids.has(row.id) }));
  }

  /** FR-04 vehicle detail page. Accepts the SEO slug or the id. */
  async detail(slugOrId: string, viewerId?: string) {
    const key = await this.cache.versionedKey(CacheNs.vehicles, `detail:source-colour:v3:${slugOrId}`);
    const vehicle = await this.cache.wrap(key, 300, async () => {
      const row = await this.prisma.replica.vehicle.findFirst({
        where: {
          ...((UUID.test(slugOrId) || /^\d+$/.test(slugOrId)) ? { id: slugOrId } : { slug: listingSlugFilter(slugOrId) }),
          status: { in: PUBLIC_DETAIL_STATUSES },
          dealer: { status: 'APPROVED' },
        },
        select: publicVehicleDetailSelect,
      });
      if (!row) return null;
      const [features, moreFromThisDealer, youMightLike] = await Promise.all([
        (row.sourceData as { importPolicy?: string } | null)?.importPolicy === 'dealertrade-only' ? Promise.resolve([]) : this.catalogue.resolveFeatures({
          makeId: row.makeId,
          modelId: row.modelId,
          generationId: row.generationId,
          variantId: row.variantId,
          vehicleId: row.id,
        }),
        this.fromSameDealer(row.id),
        this.similar(row.id),
      ]);
      const { makeId, modelId, generationId, variantId, dealerId, ...rest } = row;
      const location = {
        city: row.city,
        province: row.province,
        address: row.branch?.address ?? row.dealer.address,
        latitude: row.latitude ?? row.branch?.latitude ?? null,
        longitude: row.longitude ?? row.branch?.longitude ?? null,
        country: 'South Africa',
      };
      const mapQuery = encodeURIComponent(
        location.latitude !== null && location.longitude !== null
          ? `${location.latitude},${location.longitude}`
          : location.address || `${location.city}, South Africa`,
      );
      return {
        ...withAvailability({ ...rest, colour: detailColour(rest) }),
        colour_id: dealerTradeColourId(rest),
        colourId: standardColourId(row.colour),
        features,
        location,
        mapDetails: {
          ...location,
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${mapQuery}`,
          embedUrl: `https://maps.google.com/maps?q=${mapQuery}&output=embed`,
        },
        moreFromThisDealer,
        youMightLike,
        finance: row.status === VehicleStatus.SOLD ? null : financeExample(effectivePrice(row)),
        canEnquire: row.status !== VehicleStatus.SOLD,
      };
    });
    if (!vehicle) throw Errors.notFound('Vehicle');

    this.recordView(vehicle.id, viewerId).catch((error) => this.logger.warn(`view tracking failed: ${error.message}`));
    const flagged = await this.withFavouriteFlags([vehicle, ...vehicle.moreFromThisDealer, ...vehicle.youMightLike], viewerId);
    return {
      ...vehicle,
      insights: await this.listingInsights(vehicle.id),
      isFavourite: flagged[0].isFavourite,
      moreFromThisDealer: flagged.slice(1, 1 + vehicle.moreFromThisDealer.length),
      youMightLike: flagged.slice(1 + vehicle.moreFromThisDealer.length),
    };
  }

  /** FR-17 compare 2-4 listed vehicles side by side. */
  async compare(idsCsv: string) {
    const ids = [...new Set(splitCsv(idsCsv))];
    if (ids.length < 2 || ids.length > 4 || ids.some((id) => !(UUID.test(id) || /^\d+$/.test(id)))) {
      throw Errors.badRequest('COMPARE_COUNT', 'Compare between 2 and 4 vehicles by id');
    }
    const rows = await this.prisma.replica.vehicle.findMany({
      where: { id: { in: ids }, status: { in: PUBLIC_DETAIL_STATUSES } },
      select: { ...publicVehicleSelect, makeId: true, modelId: true, generationId: true, variantId: true, variant: { select: { id: true, name: true, slug: true, specification: true } } },
    });
    const items = await Promise.all(
      rows.map(async ({ makeId, modelId, generationId, variantId, ...row }) => ({
        ...withAvailability(row),
        features: (row.sourceData as { importPolicy?: string } | null)?.importPolicy === 'dealertrade-only' ? [] : await this.catalogue.resolveFeatures({ makeId, modelId, generationId, variantId, vehicleId: row.id }),
      })),
    );
    return { items: ids.map((id) => items.find((item) => item.id === id)).filter(Boolean) };
  }

  /** Similar vehicles: same model first, then same body category in a similar price band. */
  async similar(id: string, limit = 6) {
    const base = await this.prisma.replica.vehicle.findUnique({
      where: { id },
      select: { id: true, modelId: true, price: true, categories: { select: { id: true } } },
    });
    if (!base) throw Errors.notFound('Vehicle');
    const visible: Prisma.VehicleWhereInput = {
      id: { not: id },
      status: { in: PUBLIC_SEARCH_STATUSES },
      dealer: { status: 'APPROVED' },
    };
    const sameModel = await this.prisma.replica.vehicle.findMany({
      where: { ...visible, modelId: base.modelId },
      select: publicVehicleSelect,
      orderBy: [{ popularityScore: 'desc' }, { id: 'asc' }],
      take: limit,
    });
    const fallback = sameModel.length < limit ? await this.prisma.replica.vehicle.findMany({
      where: {
        ...visible,
        id: { notIn: [id, ...sameModel.map((vehicle) => vehicle.id)] },
        categories: { some: { id: { in: base.categories.map((category) => category.id) } } },
        price: { gte: Math.round(base.price * 0.75), lte: Math.round(base.price * 1.25) },
      },
      select: publicVehicleSelect,
      orderBy: [{ popularityScore: 'desc' }, { id: 'asc' }],
      take: limit - sameModel.length,
    }) : [];
    return [...sameModel, ...fallback].map(withAvailability);
  }

  async fromSameDealer(id: string, limit = 6) {
    const base = await this.prisma.replica.vehicle.findUnique({ where: { id }, select: { dealerId: true } });
    if (!base) throw Errors.notFound('Vehicle');
    const rows = await this.prisma.replica.vehicle.findMany({
      where: { dealerId: base.dealerId, id: { not: id }, status: { in: PUBLIC_SEARCH_STATUSES }, dealer: { status: 'APPROVED' } },
      select: publicVehicleSelect,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
    return rows.map(withAvailability);
  }

  /** Market context: average asking price of comparable listings (same model, year ±1). */
  /** Comparisons and seven-day activity belong to this installation, not the source website. */
  async listingInsights(id: string) {
    const base = await this.prisma.replica.vehicle.findUnique({ where: { id }, select: { modelId: true, year: true, variantId: true, price: true, mileage: true, publishedAt: true } });
    if (!base) throw Errors.notFound('Vehicle');
    const now = new Date();
    const since = new Date(now.getTime() - 7 * 86400000);
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));
    const [peers, views, enquiries] = await Promise.all([
      base.year === null ? Promise.resolve(null) : this.prisma.replica.vehicle.aggregate({
        where: { id: { not: id }, modelId: base.modelId, year: { gte: base.year - 1, lte: base.year + 1 },
          ...(base.variantId ? { variantId: base.variantId } : {}), status: { in: PUBLIC_SEARCH_STATUSES }, dealer: { status: 'APPROVED' } },
        _avg: { price: true, mileage: true }, _count: { price: true, mileage: true },
      }),
      this.prisma.replica.vehicleViewDaily.aggregate({ where: { vehicleId: id, day: { gte: dayStart, lte: now } }, _sum: { views: true } }),
      this.prisma.replica.enquiry.count({ where: { vehicleId: id, createdAt: { gte: since, lte: now } } }),
    ]);
    const averagePrice = peers && peers._count.price >= 3 ? peers._avg.price : null;
    const averageMileage = peers && peers._count.mileage >= 3 ? peers._avg.mileage : null;
    return { source: 'this-site' as const, comparableCount: peers?._count.price ?? 0,
      averagePrice, priceDifference: averagePrice === null ? null : base.price - averagePrice,
      averageMileage, mileageDifference: averageMileage === null || base.mileage === null ? null : base.mileage - averageMileage,
      daysListed: base.publishedAt ? Math.max(0, Math.floor((now.getTime() - base.publishedAt.getTime()) / 86400000)) : null,
      viewsLast7Days: views._sum.views ?? 0, enquiriesLast7Days: enquiries };
  }

  async marketPrice(id: string) {
    const base = await this.prisma.replica.vehicle.findUnique({ where: { id }, select: { modelId: true, year: true, price: true } });
    if (!base) throw Errors.notFound('Vehicle');
    const stats = await this.prisma.replica.vehicle.aggregate({
      where: { id: { not: id }, modelId: base.modelId, year: base.year === null ? undefined : { gte: base.year - 1, lte: base.year + 1 }, status: { in: PUBLIC_SEARCH_STATUSES } },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
      _count: true,
    });
    return {
      comparableCount: stats._count,
      averagePrice: stats._avg.price ? Math.round(stats._avg.price) : null,
      minPrice: stats._min.price,
      maxPrice: stats._max.price,
      differenceFromAverage: stats._avg.price ? Math.round(base.price - stats._avg.price) : null,
    };
  }

  // ───────────── views ─────────────

  /** Views are buffered (Redis or memory) and flushed in bulk by the worker, never one UPDATE per page view. */
  /** Count a detail-page view without loading the detail payload (used by the website adapter). */
  trackView(vehicleId: string, viewerId?: string) {
    this.recordView(vehicleId, viewerId).catch((error) => this.logger.warn(`view tracking failed: ${error.message}`));
  }

  private async recordView(vehicleId: string, viewerId?: string) {
    if (this.redis) await this.redis.hincrby(VIEWS_KEY, vehicleId, 1);
    else this.memoryViews.set(vehicleId, (this.memoryViews.get(vehicleId) ?? 0) + 1);

    if (viewerId) {
      await this.prisma.recentlyViewed.upsert({
        where: { userId_vehicleId: { userId: viewerId, vehicleId } },
        create: { userId: viewerId, vehicleId },
        update: { viewedAt: new Date() },
      });
    }
  }

  async flushViews(): Promise<number> {
    let counts: Record<string, string> = {};
    if (this.redis) {
      const temp = `${VIEWS_KEY}:flush:${process.pid}:${Date.now()}`;
      try {
        await this.redis.rename(VIEWS_KEY, temp);
      } catch {
        return 0; // key does not exist: nothing to flush
      }
      counts = await this.redis.hgetall(temp);
      await this.redis.del(temp);
    } else {
      for (const [id, count] of this.memoryViews) counts[id] = String(count);
      this.memoryViews.clear();
    }
    const entries = Object.entries(counts).filter(([id, count]) => (UUID.test(id) || /^\d+$/.test(id)) && Number(count) > 0);
    if (!entries.length) return 0;

    const values = Prisma.join(entries.map(([id, count]) => Prisma.sql`(${id}::text, ${Number(count)}::int)`));
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE vehicles v
         SET "viewCount" = v."viewCount" + c.views,
             "popularityScore" = v."viewCount" + c.views + v."enquiryCount" * ${POPULARITY.enquiry} + v."favouriteCount" * ${POPULARITY.favourite}
        FROM (VALUES ${values}) AS c(id, views)
       WHERE v.id = c.id`);
    // Per-day totals for dealer dashboards (monthly view charts). Session time zone is UTC.
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO vehicle_view_daily ("vehicleId", day, views)
      SELECT c.id, CURRENT_DATE, c.views
        FROM (VALUES ${values}) AS c(id, views)
        JOIN vehicles v ON v.id = c.id
      ON CONFLICT ("vehicleId", day) DO UPDATE SET views = vehicle_view_daily.views + EXCLUDED.views`);
    return entries.length;
  }

  /** Keep only the latest N recently viewed per user (FR-41). */
  async trimRecentlyViewed(): Promise<void> {
    await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM recently_viewed rv
       USING (
         SELECT "userId", "vehicleId",
                row_number() OVER (PARTITION BY "userId" ORDER BY "viewedAt" DESC) AS rn
           FROM recently_viewed) ranked
       WHERE rv."userId" = ranked."userId" AND rv."vehicleId" = ranked."vehicleId" AND ranked.rn > ${RECENTLY_VIEWED_LIMIT}`);
  }
}
