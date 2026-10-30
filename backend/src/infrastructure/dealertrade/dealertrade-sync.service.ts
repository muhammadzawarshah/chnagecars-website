import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { createWriteStream, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'pg';
import { CacheService, CacheNs } from '../cache/cache.service';
import { dealerTradeToken } from './dealertrade-token';
import { afterDealerTradeSync } from './dealertrade-sync-hooks';

/** Advisory lock held while the database is written (plan, apply, verify), shared by the full and quick sync. */
const WRITE_LOCK = 'SELECT pg_advisory_lock(193589719, 41002)';
const TRY_WRITE_LOCK = 'SELECT pg_try_advisory_lock(193589719, 41002) AS acquired';

/**
 * Reuses the audited API capture/reconcile pipeline; never deletes absent stock. The full sync captures all stock;
 * the quick sync runs the same pipeline every few minutes on DealerTrade's newest 100 rows only, so new listings appear
 * within minutes instead of waiting for a full capture.
 */
@Injectable()
export class DealerTradeSyncService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(DealerTradeSyncService.name);
  private running?: Promise<void>;
  private controller?: AbortController;
  private stopping = false;
  private nextRun = 0;
  private timer?: NodeJS.Timeout;
  private quickRunning?: Promise<void>;
  private quickController?: AbortController;
  private nextQuickRun = 0;

  constructor(private readonly cache: CacheService) {}

  private token(): string {
    return dealerTradeToken();
  }

  onApplicationBootstrap(): void {
    if (process.env.DEALERTRADE_SYNC_ENABLED === 'false') return;
    if (!this.token()) {
      this.logger.warn('DealerTrade auto sync requires DEALERTRADE_TOKEN or .local/dealertrade/token');
      return;
    }
    this.timer = setInterval(() => void this.tick(), 60_000);
    this.timer.unref();
    void this.tick();
  }

  async tick(): Promise<void> {
    void this.quickTick();
    if (this.stopping || this.running || Date.now() < this.nextRun ||
        process.env.DEALERTRADE_SYNC_ENABLED === 'false' || !this.token()) return;
    const minutes = Number(process.env.DEALERTRADE_SYNC_INTERVAL_MINUTES ?? 10);
    this.nextRun = Date.now() + (Number.isFinite(minutes) && minutes >= 5 ? minutes : 10) * 60_000;
    this.running = this.sync().catch((error: Error) => {
      // Child output and credentials are deliberately excluded from errors.
      this.logger.error(`DealerTrade sync failed: ${error.message}; the next scheduled run will retry`);
    }).finally(() => { this.running = undefined; });
    await this.running;
  }

  /** DealerTrade's newest rows, every DEALERTRADE_QUICK_SYNC_MINUTES (default 2; 0 disables). */
  async quickTick(): Promise<void> {
    const minutes = Number(process.env.DEALERTRADE_QUICK_SYNC_MINUTES ?? 2);
    if (this.stopping || this.quickRunning || Date.now() < this.nextQuickRun || !(Number.isFinite(minutes) && minutes >= 1) ||
        process.env.DEALERTRADE_SYNC_ENABLED === 'false' || !this.token()) return;
    this.nextQuickRun = Date.now() + minutes * 60_000;
    this.quickRunning = this.quickSync().catch((error: Error) => {
      this.logger.error(`DealerTrade quick sync failed: ${error.message}; the next run will retry`);
    }).finally(() => { this.quickRunning = undefined; });
    await this.quickRunning;
  }

  private async quickSync(): Promise<void> {
    const controller = new AbortController();
    this.quickController = controller;
    const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10_000 });
    client.on('error', () => controller.abort());
    let directory: string | undefined;
    let applying = false;
    let completed = false;
    let changed = true;
    try {
      await client.connect();
      // A full sync writing the database is never interleaved with; the next quick run catches up.
      const lock = await client.query(TRY_WRITE_LOCK);
      if (!lock.rows[0].acquired) return;
      const rows = await this.latestRows(controller.signal);
      if (!rows) return;
      directory = await mkdtemp(join(tmpdir(), 'dealertrade-quick-'));
      const source = join(directory, 'source');
      await mkdir(source, { recursive: true });
      const vehicles = JSON.stringify(rows);
      await writeFile(join(source, 'vehicles.json'), vehicles);
      await writeFile(join(source, 'dealers.json'), '[]');
      await writeFile(join(source, 'fetch-report.json'), JSON.stringify({ quick: true, uniqueVehicleRows: rows.length, vehiclesSha256: createHash('sha256').update(vehicles).digest('hex') }));
      const env = { ...process.env, DEALERTRADE_TOKEN: this.token(), DEALERTRADE_RECONCILE_DIR: directory, DEALERTRADE_REMOTE_IMAGES: '1', DEALERTRADE_RECONCILE_SCOPE: 'source' };
      await this.command('quick plan', process.execPath, ['--import', 'tsx', 'prisma/reconcile-dealertrade.ts', '--plan'], env, controller.signal, true);
      applying = true;
      await this.command('quick apply', process.execPath, ['--import', 'tsx', 'prisma/reconcile-dealertrade.ts', '--apply'], env, controller.signal, true);
      const result = JSON.parse(readFileSync(join(directory, 'apply-report.json'), 'utf8'));
      changed = result.created + result.updated > 0;
      await this.command('quick verify', process.execPath, ['--import', 'tsx', 'prisma/reconcile-dealertrade.ts', '--verify'], env, controller.signal, true);
      if (changed) this.logger.log(`DealerTrade quick sync: created=${result.created}, updated=${result.updated}, of ${rows.length} newest`);
      completed = true;
    } finally {
      if (applying && changed) await this.cache.bump(CacheNs.vehicles, CacheNs.catalogue);
      await client.end().catch(() => undefined);
      if (directory && completed) await rm(directory, { recursive: true, force: true });
      else if (directory) this.logger.warn(`DealerTrade quick sync diagnostics retained at ${directory}`);
      this.quickController = undefined;
    }
  }

  /**
   * DealerTrade lists stock newest first (created_at), so page 1 holds the latest listings. Returns null when
   * DealerTrade is rate limiting (the full capture shares the limit); the quick sync then waits as asked.
   */
  private async latestRows(signal: AbortSignal): Promise<Record<string, unknown>[] | null> {
    // The API ignores per_page and always returns 100 rows per page.
    const response = await fetch('https://dealertrade.co.za/api/apk/stock/by-dealers?page=1', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token()}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: '{}',
      signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
    });
    if (response.status === 429) {
      const seconds = Number(response.headers.get('retry-after'));
      this.nextQuickRun = Math.max(this.nextQuickRun, Date.now() + (Number.isFinite(seconds) && seconds > 60 ? seconds : 60) * 1000);
      return null;
    }
    if (!response.ok) throw new Error(`stock API returned HTTP ${response.status}`);
    const body = await response.json() as { data?: unknown };
    if (!Array.isArray(body.data)) throw new Error('stock API returned no data');
    const rows = new Map<string, Record<string, unknown>>();
    for (const row of body.data as Record<string, unknown>[]) if (row && row.vehicle_id !== undefined) rows.set(String(row.vehicle_id), row);
    return [...rows.values()];
  }

  private async sync(resumeDirectory?: string): Promise<void> {
    const controller = new AbortController();
    this.controller = controller;
    const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10_000 });
    // Losing the lock connection must also stop the importer.
    client.on('error', () => controller.abort());
    let directory: string | undefined;
    let applying = false;
    let completed = false;
    try {
      await client.connect();
      const lock = await client.query('SELECT pg_try_advisory_lock(193589719, 41001) AS acquired');
      if (!lock.rows[0].acquired) return;
      directory = resumeDirectory ?? await mkdtemp(join(tmpdir(), 'dealertrade-sync-'));
      const env = {
        ...process.env,
        DEALERTRADE_TOKEN: this.token(),
        DEALERTRADE_RECONCILE_DIR: directory,
        DEALERTRADE_OUTPUT_DIR: join(directory, 'source'),
        DEALERTRADE_REMOTE_IMAGES: '1',
      };
      this.logger.log('DealerTrade sync started');
      await this.command('fetch', 'python3', ['-u', 'scripts/fetch-dealertrade-reconcile.py', ...(resumeDirectory ? ['--resume'] : [])], env, controller.signal);
      // Waits for a running quick sync; quick syncs are skipped until this connection ends.
      await client.query(WRITE_LOCK);
      await this.command('plan', process.execPath, ['--import', 'tsx', 'prisma/reconcile-dealertrade.ts', '--plan'], env, controller.signal);
      applying = true;
      await this.command('apply', process.execPath, ['--import', 'tsx', 'prisma/reconcile-dealertrade.ts', '--apply'], env, controller.signal);
      await this.command('verify', process.execPath, ['--import', 'tsx', 'prisma/reconcile-dealertrade.ts', '--verify'], env, controller.signal);
      const result = JSON.parse(readFileSync(join(directory, 'apply-report.json'), 'utf8'));
      this.logger.log(`DealerTrade result: created=${result.created}, updated=${result.updated}, processed=${result.processed}, rawOnly=${result.rawOnly}, failures=${result.failures.length}`);
      completed = true;
      this.logger.log('DealerTrade sync completed and verified');
      // e.g. copying new dealer logos to our server (DealerTradeMediaService).
      for (const hook of afterDealerTradeSync) hook();
    } finally {
      // An apply can partially succeed before a later row fails.
      if (applying) await this.cache.bump(CacheNs.vehicles, CacheNs.catalogue);
      await client.end().catch(() => undefined);
      if (directory && completed) await rm(directory, { recursive: true, force: true });
      else if (directory) this.logger.warn(`DealerTrade failure diagnostics retained at ${directory}`);
      this.controller = undefined;
    }
  }

  private command(stage: string, command: string, args: string[], env: NodeJS.ProcessEnv, signal: AbortSignal, quiet = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!quiet) this.logger.log(`DealerTrade ${stage} started`);
      const log = createWriteStream(join(env.DEALERTRADE_RECONCILE_DIR!, `${stage.replace(/ /g, '-')}.log`), { mode: 0o600 });
      const child = spawn(command, args, { cwd: process.cwd(), env, signal, killSignal: 'SIGKILL', stdio: ['ignore', 'pipe', 'pipe'] });
      child.stdout.pipe(log, { end: false });
      child.stderr.pipe(log, { end: false });
      log.on('error', () => child.kill('SIGKILL'));
      // Bound stalled API/import steps; fetcher implements rate limiting and retries itself.
      const timeout = setTimeout(() => child.kill('SIGKILL'), 45 * 60_000);
      child.once('error', () => { clearTimeout(timeout); log.end(); reject(new Error(`${stage} could not start or was cancelled`)); });
      child.once('close', (code) => {
        clearTimeout(timeout);
        log.end();
        if (code === 0) { if (!quiet) this.logger.log(`DealerTrade ${stage} completed`); resolve(); }
        else reject(new Error(`${stage} exited with code ${code}`));
      });
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
    this.controller?.abort();
    this.quickController?.abort();
    await Promise.all([this.running, this.quickRunning]);
  }
}
