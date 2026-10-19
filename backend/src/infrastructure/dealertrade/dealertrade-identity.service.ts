import { Global, Injectable, Module } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../database/prisma.service';

type VehicleIdentity = { id: string; sourceId: string; dealerId: string; sourceDealerId: string };
type DealerIdentity = { id: string; slug: string };
const numericId = (value: unknown): value is string => typeof value === 'string' && /^\d+$/.test(value);

/** The importer deliberately preserves this identity namespace, including for DealerTrade rows. */
export function importedDealerUuid(sourceId: string) {
  const h = createHash('sha256').update(`changecars-fbook:dealer:${sourceId}`).digest('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
}

/** Resolve legacy UUID URLs alongside the original DealerTrade primary IDs. */
@Injectable()
export class DealerTradeIdentityService {
  private expiresAt = 0;
  private whatsapp = new Map<string, string | null>();
  private loading?: Promise<void>;
  private external = new Map<string, string>();
  private vehicles = new Map<string, string>();
  private dealers = new Map<string, { id: string; slug: string }>();

  constructor(private readonly prisma: PrismaService) {}

  async refresh() {
    if (Date.now() < this.expiresAt) return;
    if (!this.loading) this.loading = this.load().finally(() => { this.loading = undefined; });
    await this.loading;
  }

  private async load() {
    // JSON projections avoid loading private/raw feed payloads or image galleries into the identity cache.
    const [vehicles, dealers, sources, aliases] = await Promise.all([
      this.prisma.$queryRaw<VehicleIdentity[]>`SELECT id, "dealerId", "sourceData"->'dealertrade'->>'vehicle_id' AS "sourceId", "sourceData"->'dealertrade'->>'dealer_id' AS "sourceDealerId" FROM vehicles WHERE "sourceData"->'dealertrade'->>'vehicle_id' IS NOT NULL`,
      this.prisma.dealer.findMany({ select: { id: true, slug: true } }),
      this.prisma.$queryRaw<{ sourceId: string; whatsappNumber: string | null }[]>`SELECT payload->>'dealer_id' AS "sourceId", NULLIF(TRIM(payload->>'whatsapp_number'), '') AS "whatsappNumber" FROM source_feed_records WHERE source='dealertrade' AND kind='dealer'`,
      this.prisma.dealerTradeIdAlias.findMany(),
    ]);
    this.setIdentities(vehicles, dealers, sources.map(row => row.sourceId));
    this.whatsapp = new Map(sources.map(row => [row.sourceId, row.whatsappNumber]));
    for (const alias of aliases) {
      this.external.set(alias.legacyId, alias.sourceId);
      this.external.set(alias.legacyId.replace(/-/g, ''), alias.sourceId);
      if (alias.entity === 'vehicle' && this.vehicles.has(alias.sourceId)) {
        this.vehicles.set(alias.legacyId, this.vehicles.get(alias.sourceId)!);
        this.vehicles.set(alias.legacyId.replace(/-/g, ''), this.vehicles.get(alias.sourceId)!);
      }
      if (alias.entity === 'dealer' && this.dealers.has(alias.sourceId)) this.dealers.set(alias.legacyId, this.dealers.get(alias.sourceId)!);
    }
    this.expiresAt = Date.now() + 60_000;
  }

  setIdentities(rows: VehicleIdentity[], dealerRows: DealerIdentity[], sourceDealers: string[]) {
    const external = new Map<string, string>(), vehicles = new Map<string, string>();
    const dealers = new Map<string, DealerIdentity>();
    const byId = new Map(dealerRows.map(row => [row.id, row]));
    const record = (id: string, sourceId: string) => {
      if (!numericId(sourceId)) throw Error('Invalid DealerTrade source identity');
      if (external.has(id) && external.get(id) !== sourceId) throw Error('Conflicting DealerTrade identity');
      external.set(id, sourceId); external.set(id.replace(/-/g, ''), sourceId);
    };
    for (const sourceId of sourceDealers) {
      const dealer = byId.get(sourceId) ?? byId.get(importedDealerUuid(sourceId));
      if (dealer) { dealers.set(sourceId, dealer); record(dealer.id, sourceId); }
    }
    for (const row of rows) {
      if (vehicles.has(row.sourceId) && vehicles.get(row.sourceId) !== row.id) throw Error('Duplicate DealerTrade vehicle identity');
      record(row.id, row.sourceId); vehicles.set(row.sourceId, row.id);
      const dealer = byId.get(row.dealerId);
      if (dealer) {
        if (dealers.has(row.sourceDealerId) && dealers.get(row.sourceDealerId)!.id !== dealer.id) throw Error('Conflicting DealerTrade dealer identity');
        dealers.set(row.sourceDealerId, dealer); record(dealer.id, row.sourceDealerId);
      }
    }
    this.external = external; this.vehicles = vehicles; this.dealers = dealers;
  }

  /** UUID and legacy 32-character web IDs are both accepted; output original IDs as opaque strings. */
  present(value: unknown): unknown {
    if (typeof value === 'string') return this.external.get(value) ?? value;
    if (value instanceof Date || value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(item => this.present(item));
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, this.present(item)]));
  }

  whatsappNumber(id: string) { return this.whatsapp.get(this.external.get(id) ?? id) ?? null; }

  dealerIds() { return [...new Set([...this.dealers.values()].map(row => row.id))]; }

  async request(req: Request, _res: Response, next: NextFunction) {
    try {
      const url = new URL(req.url, 'http://local');
      // Leave account/auth/admin/dealer portal identities and their contracts alone.
      if (!/\/(vehicles|dealers|customers|me|enquiries|promotions)(\/|$)|\/web\/(cars|forms)(\/|$)/.test(url.pathname) || /\/(admin|dealer|dashboard)\//.test(url.pathname)) return next();
      await this.refresh();
      const parts = url.pathname.split('/');
      for (let i = 1; i < parts.length; i++) {
        if (!numericId(parts[i]) && !this.vehicles.has(parts[i]) && !this.dealers.has(parts[i])) continue;
        const parent = parts[i - 1];
        if (parent === 'vehicles' || parent === 'favourites') parts[i] = this.vehicles.get(parts[i]) ?? parts[i];
        if (parent === 'cars' && parts.includes('web')) parts[i] = this.vehicles.get(parts[i])?.replace(/-/g, '') ?? parts[i];
        if (parent === 'dealers') parts[i] = this.dealers.get(parts[i])?.slug ?? parts[i];
      }
      if (url.searchParams.has('ids')) url.searchParams.set('ids', url.searchParams.get('ids')!.split(',').map(id => this.vehicles.get(id) ?? id).join(','));
      for (const key of ['dealer', 'dealership']) {
        const value = url.searchParams.get(key);
        if (value) url.searchParams.set(key, this.dealers.get(value)?.slug ?? value);
      }
      const input = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.map(input);
        if (!value || typeof value !== 'object') return value;
        return Object.fromEntries(Object.entries(value).map(([key, item]) => {
          const id = typeof item === 'number' ? String(item) : item;
          if (numericId(id) && key === 'carId' && parts.includes('web')) return [key, this.vehicles.get(id)?.replace(/-/g, '') ?? item];
          if (numericId(id) && key === 'vehicleId') return [key, this.vehicles.get(id) ?? item];
          if (numericId(id) && key === 'dealerId') return [key, this.dealers.get(id)?.id ?? item];
          return [key, input(item)];
        }));
      };
      req.body = input(req.body);
      req.url = parts.join('/') + (url.search ? url.search : '');
      next();
    } catch (error) { next(error); }
  }
}

@Global()
@Module({ providers: [DealerTradeIdentityService], exports: [DealerTradeIdentityService] })
export class DealerTradeIdentityModule {}
