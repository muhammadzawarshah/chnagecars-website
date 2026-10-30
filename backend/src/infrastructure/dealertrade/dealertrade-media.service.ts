import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { PrismaService } from '../database/prisma.service';
import { afterDealerTradeSync } from './dealertrade-sync-hooks';

// Dealer and group logos exist at 200px (what changecars.co.za shows); larger sizes are often not generated.
const SOURCE_BASE = 'https://www.changecars.co.za/images/200/';
const FORMATS = new Set(['jpeg', 'png', 'webp', 'gif', 'avif']);

/** Folder the API serves at /media (see main.ts). Override with DEALERTRADE_MEDIA_DIR. */
export const mediaRoot = () => process.env.DEALERTRADE_MEDIA_DIR || join(process.cwd(), 'media');

/**
 * Copies DealerTrade's dealer logos and dealer group logos to our own server, so apps and the website never load
 * them from changecars.co.za. Files are named after their DealerTrade path, so each image is downloaded once.
 * Runs at startup and after every full DealerTrade sync; dealers' logoUrl then points at our copy.
 */
@Injectable()
export class DealerTradeMediaService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DealerTradeMediaService.name);
  private readonly dir = join(mediaRoot(), 'dealertrade');
  private files = new Set<string>();
  private running?: Promise<void>;
  /** sha256 of the image changecars.co.za returns (with HTTP 200) for a file it does not have. */
  private placeholder?: string;

  constructor(private readonly prisma: PrismaService) {
    mkdirSync(this.dir, { recursive: true });
    this.files = new Set(readdirSync(this.dir));
    afterDealerTradeSync.add(() => void this.mirror());
  }

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV !== 'test' && process.env.DEALERTRADE_MEDIA_MIRROR !== 'false') void this.mirror();
  }

  /** Our URL for a DealerTrade image path, or DealerTrade's own until the copy exists. */
  url(sourcePath: string): string {
    const name = this.fileName(sourcePath);
    // Another process (API or worker) may have stored it since this one started.
    if (name && !this.files.has(name) && existsSync(join(this.dir, name))) this.files.add(name);
    return name && this.files.has(name) ? `${this.publicBase()}/media/dealertrade/${name}` : new URL(sourcePath, SOURCE_BASE).toString();
  }

  /** Downloads missing logos and points dealers at the copies. Never runs twice at once. */
  mirror(): Promise<void> {
    this.running ??= this.run()
      .catch((error: Error) => this.logger.warn(`DealerTrade logo copy failed: ${error.message}`))
      .finally(() => { this.running = undefined; });
    return this.running;
  }

  private async run() {
    const rows = await this.prisma.$queryRaw<{ dealerId: string; image: string | null; groups: unknown }[]>`
      SELECT "externalId" AS "dealerId", NULLIF(TRIM(payload->>'dealer_image'), '') AS image, payload->'dealer_groups' AS groups
      FROM source_feed_records WHERE source = 'dealertrade' AND kind = 'dealer'`;
    const paths = new Set<string>();
    for (const row of rows) {
      if (row.image) paths.add(row.image);
      for (const group of Array.isArray(row.groups) ? row.groups : []) {
        if (typeof group?.logo === 'string' && group.logo.trim()) paths.add(group.logo.trim());
      }
    }
    const missing = [...paths].filter((path) => !this.files.has(this.fileName(path) ?? ''));
    if (missing.length) {
      const probe = await fetch(new URL(`dealers/000000/missing-${Date.now()}.png`, SOURCE_BASE), { signal: AbortSignal.timeout(30_000) });
      this.placeholder = probe.ok ? createHash('sha256').update(Buffer.from(await probe.arrayBuffer())).digest('hex') : undefined;
    }
    let downloaded = 0, failed = 0;
    for (let i = 0; i < missing.length; i += 4) {
      const results = await Promise.all(missing.slice(i, i + 4).map((path) => this.download(path)));
      downloaded += results.filter(Boolean).length;
      failed += results.filter((ok) => !ok).length;
    }
    let updated = 0;
    for (const row of rows) {
      if (!row.image || !this.files.has(this.fileName(row.image) ?? '')) continue;
      const logoUrl = this.url(row.image);
      const result = await this.prisma.dealer.updateMany({ where: { id: row.dealerId, OR: [{ logoUrl: null }, { logoUrl: { not: logoUrl } }] }, data: { logoUrl } });
      updated += result.count;
    }
    if (downloaded || failed || updated) this.logger.log(`DealerTrade logos: ${downloaded} downloaded, ${failed} failed, ${updated} dealers updated, ${this.files.size} stored`);
  }

  private async download(path: string): Promise<boolean> {
    const name = this.fileName(path);
    if (!name) return false;
    try {
      const response = await fetch(new URL(path, SOURCE_BASE), { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (this.placeholder && createHash('sha256').update(bytes).digest('hex') === this.placeholder) throw new Error('DealerTrade has no such image');
      const meta = await sharp(bytes, { failOn: 'error', limitInputPixels: 40_000_000 }).metadata();
      if (!meta.width || !meta.height || !FORMATS.has(meta.format ?? '')) throw new Error('not an image');
      const file = join(this.dir, name);
      await writeFile(`${file}.tmp`, bytes);
      await rename(`${file}.tmp`, file);
      this.files.add(name);
      return true;
    } catch (error) {
      this.logger.warn(`DealerTrade logo ${path} not copied: ${(error as Error).message}`);
      return false;
    }
  }

  /** sha256 of the DealerTrade path plus its extension; null for paths that are not images. */
  private fileName(path: string): string | null {
    const ext = path.split('?')[0].split('.').pop()?.toLowerCase();
    if (!ext || !['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext) || path.includes('..')) return null;
    return `${createHash('sha256').update(path).digest('hex')}.${ext === 'jpeg' ? 'jpg' : ext}`;
  }

  private publicBase(): string {
    return (process.env.API_PUBLIC_URL || 'https://changecarapi.wowcar.co.th').replace(/\/+$/, '');
  }
}

