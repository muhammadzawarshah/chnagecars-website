import { standardColourId, colourStockOptions } from '../vehicles/standard-colours';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { gzip } from 'node:zlib';
import { Controller, Get, Injectable, Logger, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/auth.decorators';
import { PublicCache } from '../../common/interceptors/cache-headers.interceptor';
import { Errors } from '../../common/errors/app-error';
import { CacheNs, CacheService } from '../../infrastructure/cache/cache.service';
import { AppConfig } from '../../config/app-config.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { buildWhere } from './search.builder';
import { filterVehicleSelect } from './filter-data';
import { slugify } from '../../common/utils/strings';
import { DealerTradeStockService } from '../../infrastructure/dealertrade/dealertrade-stock.service';
import { currentDealerScope } from '../../infrastructure/database/dealer-scope';

const zip = promisify(gzip);
const hash = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const label = (code: string) => code.toLowerCase().replace(/_/g, '-');

export function snapshotPayload(rows: any[]) {
  const cylinderCounts = new Map<number, number>();
  for (const row of rows) {
    if (row.cylinders != null && row.cylinders > 0) {
      cylinderCounts.set(row.cylinders, (cylinderCounts.get(row.cylinders) ?? 0) + 1);
    }
  }
  const dictionaries: Record<string, Record<string, unknown>> = Object.fromEntries(
    ['make', 'model', 'variant', 'body_type', 'fuel_type', 'transmission', 'drivetrain', 'color', 'color_ids', 'condition', 'availability', 'province', 'city', 'dealer'].map(key => [key, {}]),
  );
  const scalar = (group: string, code: string | null, name?: string) => {
    if (!code) return null;
    dictionaries[group][code] = name ?? code;
    return code;
  };
  const vehicles = rows.map(row => {
    const model = `${row.make.slug}:${row.model.slug}`;
    dictionaries.make[row.make.slug] = row.make.name;
    dictionaries.model[model] = { name: row.model.name, make_id: row.make.slug };
    const variant = row.variant ? `${model}:${row.variant.slug}` : null;
    if (variant) dictionaries.variant[variant] = { name: row.variant.name, make_id: row.make.slug, model_id: model };
    // Stable ids ("kwazulu-natal") from stored names ("KwaZulu-Natal"); the name goes in the dictionary.
    const province = row.province ? slugify(row.province) : null;
    const city = row.city && province ? `${province}:${row.city.trim().toLowerCase()}` : null;
    if (city) dictionaries.city[city] = { name: row.city, province_id: province };
    const categories = row.categories.filter((item: any) => item.isActive).map((item: any) => scalar('body_type', item.slug, item.name));
    return {
      id: row.id, make: row.make.slug, model, variant,
      body_type: categories, fuel_type: scalar('fuel_type', row.fuelType),
      transmission: scalar('transmission', row.transmission), drivetrain: scalar('drivetrain', row.drivetrain),
      color: scalar('color', row.colour?.trim().toLowerCase() || null),
      color_id: standardColourId(row.colour),
      condition: scalar('condition', label(row.condition)),
      availability: scalar('availability', row.status === 'PUBLISHED' ? 'available' : 'reserved'),
      province: scalar('province', province, row.province ?? undefined), city,
      dealer: scalar('dealer', row.dealer.slug, row.dealer.name),
      price: row.price, sale_price: row.isSpecial && row.specialPrice ? row.specialPrice : row.price,
      year: row.year, mileage: row.mileage, seats: row.seats, cylinders: row.cylinders ?? null,
      engine_capacity_cc: row.engineCapacityCc, power_kw: row.powerKw,
      is_special: row.isSpecial, is_featured: row.isFeatured,
    };
  });
  // Expose canonical list_colours IDs alongside the existing filter colour keys.
  for (const vehicle of vehicles) {
    if (!vehicle.color || vehicle.color_id === null) continue;
    const ids = (dictionaries.color_ids[vehicle.color] ??= []) as number[];
    if (!ids.includes(vehicle.color_id)) ids.push(vehicle.color_id);
  }
  for (const ids of Object.values(dictionaries.color_ids)) (ids as number[]).sort((a, b) => a - b);
  const cylinders = [...cylinderCounts].sort(([a], [b]) => a - b).map(([value, count]) => ({ value, count }));
  return { schema_version: 1, total: vehicles.length, dictionaries, options: { cylinders, colour: colourStockOptions(rows) }, vehicles };
}

const MANIFEST_KEY = 'snapshot:manifest:v3';
const scopeKey = () => currentDealerScope()?.dealerIds.join(',') ?? '';
const storedSummary = { revision: true, total: true, sha256: true, compressedBytes: true, generatedAt: true } as const;
type StoredSummary = { revision: string; total: number; sha256: string; compressedBytes: number; generatedAt: Date };

@Injectable()
export class FilterSnapshotsService {
  private readonly logger = new Logger(FilterSnapshotsService.name);
  /** Per dealer scope ('' = full marketplace, see dealer-scope.ts). */
  private generating = new Map<string, Promise<any>>();
  /** Last manifest this process returned per scope; served while a newer snapshot is built. */
  private latest = new Map<string, any>();
  constructor(private readonly prisma: PrismaService, private readonly cache: CacheService, private readonly config: AppConfig) {}

  /**
   * Never makes a caller wait for a rebuild (~2.5s for 45k vehicles) once any snapshot exists: when inventory
   * changed or the cache expired, the previous snapshot is returned and the new one is built in the background.
   */
  async manifest() {
    const key = await this.cache.versionedKey(CacheNs.vehicles, MANIFEST_KEY);
    const cached = await this.cache.get<any>(key);
    if (cached) { this.latest.set(scopeKey(), cached); return cached; }
    const rebuild = this.rebuild(key);
    const previous = this.latest.get(scopeKey()) ?? await this.latestStored();
    if (!previous) return rebuild;
    rebuild.catch((error) => this.logger.warn(`filter snapshot rebuild failed: ${(error as Error).message}`));
    return previous;
  }

  /** Builds the current snapshot and waits for it (admin "refresh snapshot"). */
  async regenerate() {
    return this.rebuild(await this.cache.versionedKey(CacheNs.vehicles, MANIFEST_KEY));
  }

  private rebuild(key: string): Promise<any> {
    const scope = scopeKey();
    let running = this.generating.get(scope);
    if (!running) {
      running = this.generate(key)
        .then((manifest) => { this.latest.set(scope, manifest); return manifest; })
        .finally(() => this.generating.delete(scope));
      this.generating.set(scope, running);
    }
    return running;
  }

  private async latestStored() {
    const stored = await this.prisma.replica.vehicleFilterSnapshot.findFirst({ where: { dealerScope: scopeKey() || null }, select: storedSummary, orderBy: { generatedAt: 'desc' } });
    return stored ? this.toManifest(stored) : undefined;
  }

  private toManifest(stored: StoredSummary) {
    return { schema_version: 1, revision: stored.revision, total: stored.total,
      snapshot_url: `${currentDealerScope()?.path ?? `/${this.config.get('API_PREFIX').replace(/^\/+|\/+$/g, '')}`}/vehicle-filters/snapshots/${stored.revision}.json.gz`,
      sha256: stored.sha256, compressed_bytes: stored.compressedBytes, generated_at: stored.generatedAt.toISOString(),
    };
  }

  private async generate(key: string) {
    const rows = await this.prisma.replica.vehicle.findMany({ where: buildWhere({}), select: { ...filterVehicleSelect, specialPrice: true }, orderBy: { id: 'asc' } });
    // Stable row/category order produces a content-addressed immutable revision.
    for (const row of rows) row.categories.sort((a, b) => a.slug.localeCompare(b.slug));
    const payload = snapshotPayload(rows);
    // The scope is part of the revision, so two dealer apps never share (or overwrite) a snapshot row.
    const revision = `inv-${hash(JSON.stringify(payload) + scopeKey())}`;
    let stored: StoredSummary | null = await this.prisma.vehicleFilterSnapshot.findUnique({ where: { revision }, select: storedSummary });
    if (!stored) {
      const bytes = await zip(Buffer.from(JSON.stringify({ ...payload, revision })), { level: 9 });
      stored = await this.prisma.vehicleFilterSnapshot.upsert({ where: { revision }, update: {}, select: storedSummary, create: {
        revision, total: payload.total, sha256: hash(bytes), compressedBytes: bytes.length, content: bytes, dealerScope: scopeKey() || null,
      } });
    }
    const manifest = this.toManifest(stored);
    await this.cache.set(key, manifest, 120);
    return manifest;
  }

  async download(file: string) {
    if (!/^inv-[a-f0-9]{64}\.json\.gz$/.test(file)) throw Errors.notFound('Snapshot');
    const row = await this.prisma.vehicleFilterSnapshot.findUnique({ where: { revision: file.slice(0, -8) } });
    // A dealer app only downloads its own snapshots, and the marketplace app only marketplace ones.
    if (!row || (row.dealerScope ?? '') !== scopeKey()) throw Errors.notFound('Snapshot');
    return row;
  }
}

@Public()
@ApiTags('Vehicle filter snapshots')
@Controller('vehicle-filters')
export class FilterSnapshotsController {
  constructor(private readonly snapshots: FilterSnapshotsService, private readonly stock: DealerTradeStockService) {}
  @Get('manifest') @PublicCache(30)
  @ApiOperation({ summary: 'Current immutable filter snapshot revision, URL and compressed checksum, plus live DealerTrade stock counts' })
  async manifest() {
    // Live counts sit beside the snapshot, so they never change its revision or checksum.
    const [manifest, source] = await Promise.all([this.snapshots.manifest(), this.stock.summary()]);
    return { ...manifest, source };
  }
  @Get('snapshots/:file')
  @ApiOperation({ summary: 'Download immutable application/gzip snapshot; SHA256 covers compressed bytes' })
  async download(@Param('file') file: string, @Res() response: Response) {
    const row = await this.snapshots.download(file);
    response.setHeader('Content-Type', 'application/gzip');
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.setHeader('ETag', `"${row.sha256}"`);
    response.send(Buffer.from(row.content));
  }
}
