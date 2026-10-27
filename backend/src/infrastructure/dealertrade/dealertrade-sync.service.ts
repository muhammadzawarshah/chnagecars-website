import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { createWriteStream, readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'pg';
import { CacheService, CacheNs } from '../cache/cache.service';

/** Reuses the audited API capture/reconcile pipeline; never deletes absent stock. */
@Injectable()
export class DealerTradeSyncService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(DealerTradeSyncService.name);
  private running?: Promise<void>;
  private controller?: AbortController;
  private stopping = false;
  private nextRun = 0;
  private timer?: NodeJS.Timeout;

  constructor(private readonly cache: CacheService) {}

  private token(): string {
    if (process.env.DEALERTRADE_TOKEN?.trim()) return process.env.DEALERTRADE_TOKEN.trim();
    try { return readFileSync(join(process.cwd(), '.local/dealertrade/token'), 'utf8').trim(); }
    catch { return ''; }
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
    if (this.stopping || this.running || Date.now() < this.nextRun ||
        process.env.DEALERTRADE_SYNC_ENABLED === 'false' || !this.token()) return;
    const minutes = Number(process.env.DEALERTRADE_SYNC_INTERVAL_MINUTES ?? 720);
    this.nextRun = Date.now() + (Number.isFinite(minutes) && minutes >= 5 ? minutes : 720) * 60_000;
    this.running = this.sync().catch((error: Error) => {
      // Child output and credentials are deliberately excluded from errors.
      this.logger.error(`DealerTrade sync failed: ${error.message}; the next scheduled run will retry`);
    }).finally(() => { this.running = undefined; });
    await this.running;
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
      await this.command('plan', process.execPath, ['--import', 'tsx', 'prisma/reconcile-dealertrade.ts', '--plan'], env, controller.signal);
      applying = true;
      await this.command('apply', process.execPath, ['--import', 'tsx', 'prisma/reconcile-dealertrade.ts', '--apply'], env, controller.signal);
      await this.command('verify', process.execPath, ['--import', 'tsx', 'prisma/reconcile-dealertrade.ts', '--verify'], env, controller.signal);
      const result = JSON.parse(readFileSync(join(directory, 'apply-report.json'), 'utf8'));
      this.logger.log(`DealerTrade result: created=${result.created}, updated=${result.updated}, processed=${result.processed}, rawOnly=${result.rawOnly}, failures=${result.failures.length}`);
      completed = true;
      this.logger.log('DealerTrade sync completed and verified');
    } finally {
      // An apply can partially succeed before a later row fails.
      if (applying) await this.cache.bump(CacheNs.vehicles, CacheNs.catalogue);
      await client.end().catch(() => undefined);
      if (directory && completed) await rm(directory, { recursive: true, force: true });
      else if (directory) this.logger.warn(`DealerTrade failure diagnostics retained at ${directory}`);
      this.controller = undefined;
    }
  }

  private command(stage: string, command: string, args: string[], env: NodeJS.ProcessEnv, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.log(`DealerTrade ${stage} started`);
      const log = createWriteStream(join(env.DEALERTRADE_RECONCILE_DIR!, `${stage}.log`), { mode: 0o600 });
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
        if (code === 0) { this.logger.log(`DealerTrade ${stage} completed`); resolve(); }
        else reject(new Error(`${stage} exited with code ${code}`));
      });
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
    this.controller?.abort();
    await this.running;
  }
}
