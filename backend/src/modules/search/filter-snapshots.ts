import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { gzip } from 'node:zlib';
import { Controller, Get, Injectable, Param, Res } from '@nestjs/common';
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

const zip = promisify(gzip);
const hash = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const label = (code: string) => code.toLowerCase().replace(/_/g, '-');

export function snapshotPayload(rows: any[]) {
  const dictionaries: Record<string, Record<string, unknown>> = Object.fromEntries(
    ['make', 'model', 'variant', 'body_type', 'fuel_type', 'transmission', 'drivetrain', 'color', 'condition', 'availability', 'province', 'city', 'dealer'].map(key => [key, {}]),
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
    const province = row.province ? label(row.province) : null;
    const city = row.city && province ? `${province}:${row.city.trim().toLowerCase()}` : null;
    if (city) dictionaries.city[city] = { name: row.city, province_id: province };
    const categories = row.categories.filter((item: any) => item.isActive).map((item: any) => scalar('body_type', item.slug, item.name));
    return {
      id: row.id, make: row.make.slug, model, variant,
      body_type: categories, fuel_type: scalar('fuel_type', row.fuelType),
      transmission: scalar('transmission', row.transmission), drivetrain: scalar('drivetrain', row.drivetrain),
      color: scalar('color', row.colour?.trim().toLowerCase() || null),
      condition: scalar('condition', label(row.condition)),
      availability: scalar('availability', row.status === 'PUBLISHED' ? 'available' : 'reserved'),
      province: scalar('province', province), city,
      dealer: scalar('dealer', row.dealer.slug, row.dealer.name),
      price: row.price, sale_price: row.isSpecial && row.specialPrice ? row.specialPrice : row.price,
      year: row.year, mileage: row.mileage, seats: row.seats,
      engine_capacity_cc: row.engineCapacityCc, power_kw: row.powerKw,
      is_special: row.isSpecial, is_featured: row.isFeatured,
    };
  });
  return { schema_version: 1, total: vehicles.length, dictionaries, vehicles };
}

@Injectable()
export class FilterSnapshotsService {
  private generating?: Promise<any>;
  constructor(private readonly prisma: PrismaService, private readonly cache: CacheService, private readonly config: AppConfig) {}

  async manifest() {
    const key = await this.cache.versionedKey(CacheNs.vehicles, 'snapshot:manifest:v1');
    const cached = await this.cache.get<any>(key);
    if (cached) return cached;
    if (this.generating) return this.generating;
    this.generating = this.generate(key);
    try { return await this.generating; } finally { this.generating = undefined; }
  }

  private async generate(key: string) {
    const rows = await this.prisma.replica.vehicle.findMany({ where: buildWhere({}), select: { ...filterVehicleSelect, specialPrice: true }, orderBy: { id: 'asc' } });
    // Stable row/category order produces a content-addressed immutable revision.
    for (const row of rows) row.categories.sort((a, b) => a.slug.localeCompare(b.slug));
    const payload = snapshotPayload(rows);
    const revision = `inv-${hash(JSON.stringify(payload))}`;
    let stored = await this.prisma.vehicleFilterSnapshot.findUnique({ where: { revision } });
    if (!stored) {
      const bytes = await zip(Buffer.from(JSON.stringify({ ...payload, revision })), { level: 9 });
      stored = await this.prisma.vehicleFilterSnapshot.upsert({ where: { revision }, update: {}, create: {
        revision, total: payload.total, sha256: hash(bytes), compressedBytes: bytes.length, content: bytes,
      } });
    }
    const manifest = { schema_version: 1, revision, total: stored.total,
      snapshot_url: `/${this.config.get('API_PREFIX').replace(/^\/+|\/+$/g, '')}/vehicle-filters/snapshots/${revision}.json.gz`,
      sha256: stored.sha256, compressed_bytes: stored.compressedBytes, generated_at: stored.generatedAt.toISOString(),
    };
    await this.cache.set(key, manifest, 120);
    return manifest;
  }

  async download(file: string) {
    if (!/^inv-[a-f0-9]{64}\.json\.gz$/.test(file)) throw Errors.notFound('Snapshot');
    const row = await this.prisma.vehicleFilterSnapshot.findUnique({ where: { revision: file.slice(0, -8) } });
    if (!row) throw Errors.notFound('Snapshot');
    return row;
  }
}

@Public()
@ApiTags('Vehicle filter snapshots')
@Controller('vehicle-filters')
export class FilterSnapshotsController {
  constructor(private readonly snapshots: FilterSnapshotsService) {}
  @Get('manifest') @PublicCache(30)
  @ApiOperation({ summary: 'Current immutable filter snapshot revision, URL and compressed checksum' })
  manifest() { return this.snapshots.manifest(); }
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
