import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { hostname } from 'node:os';
import { Prisma } from '../../generated/prisma/client';
import { AppConfig } from '../../config/app-config.service';
import { PrismaService } from '../database/prisma.service';
import { OutboxRecord, OutboxService } from './outbox.service';

const STALE_LOCK_MINUTES = 5;
const RETENTION_DAYS = 7;

type ClaimedEvent = OutboxRecord & { maxAttempts: number };

/**
 * Worker-side dispatcher. Safe to run on many machines at once: rows are claimed with
 * FOR UPDATE SKIP LOCKED so each event is processed by one worker at a time.
 * Failures retry with exponential backoff; after maxAttempts the event goes to DEAD.
 */
@Injectable()
export class OutboxProcessor implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(OutboxProcessor.name);
  private readonly workerId = `${hostname()}:${process.pid}`;
  private timer?: NodeJS.Timeout;
  private running?: Promise<void>;
  private stopping = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly config: AppConfig,
  ) {}

  onApplicationBootstrap(): void {
    const interval = this.config.get('WORKER_OUTBOX_POLL_MS');
    this.timer = setInterval(() => {
      if (!this.running && !this.stopping) {
        this.running = this.drain().finally(() => (this.running = undefined));
      }
    }, interval);
    this.logger.log(`Outbox dispatcher started (${this.workerId}, every ${interval}ms)`);
  }

  async onApplicationShutdown(): Promise<void> {
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
    await this.running;
  }

  /** Process batches until the queue is empty (or shutdown starts). */
  async drain(): Promise<void> {
    try {
      for (let i = 0; i < 20 && !this.stopping; i++) {
        const processed = await this.processBatch();
        if (processed < this.config.get('WORKER_OUTBOX_BATCH')) return;
      }
    } catch (error) {
      this.logger.error(`Outbox batch failed: ${(error as Error).message}`);
    }
  }

  async processBatch(): Promise<number> {
    const limit = this.config.get('WORKER_OUTBOX_BATCH');
    const batch = await this.prisma.$queryRaw<ClaimedEvent[]>(Prisma.sql`
      UPDATE outbox_events
         SET status = 'PROCESSING', "lockedAt" = now(), "lockedBy" = ${this.workerId}, attempts = attempts + 1
       WHERE id IN (
         SELECT id FROM outbox_events
          WHERE status = 'PENDING' AND "availableAt" <= now()
          ORDER BY "availableAt"
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED)
      RETURNING id, type, "aggregateType", "aggregateId", payload, attempts, "maxAttempts"`);

    for (const event of batch) await this.dispatch(event);
    return batch.length;
  }

  private async dispatch(event: ClaimedEvent): Promise<void> {
    const handlers = this.outbox.handlersFor(event.type);
    try {
      for (const entry of handlers) await entry.handler(event);
      const sensitive = handlers.some((entry) => entry.sensitive);
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'DONE',
          processedAt: new Date(),
          lockedAt: null,
          lastError: null,
          ...(sensitive ? { payload: { scrubbed: true } } : {}),
        },
      });
    } catch (error) {
      const message = ((error as Error).message ?? 'unknown error').slice(0, 2000);
      const dead = event.attempts >= event.maxAttempts;
      const backoffMs = Math.min(3600_000, 5000 * 2 ** Math.max(0, event.attempts - 1));
      this.logger.warn(`Outbox ${event.type} ${event.id} failed (attempt ${event.attempts}): ${message}`);
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: dead ? 'DEAD' : 'PENDING',
          lastError: message,
          lockedAt: null,
          availableAt: new Date(Date.now() + backoffMs),
        },
      });
      if (dead) this.logger.error(`Outbox event ${event.id} (${event.type}) moved to DEAD after ${event.attempts} attempts`);
    }
  }

  /** Release events whose worker died mid-processing. */
  @Interval('outbox-recover-stale', 60_000)
  async recoverStale(): Promise<void> {
    const released = await this.prisma.$executeRaw(Prisma.sql`
      UPDATE outbox_events SET status = 'PENDING', "lockedAt" = NULL
       WHERE status = 'PROCESSING' AND "lockedAt" < now() - make_interval(mins => ${STALE_LOCK_MINUTES})`);
    if (released) this.logger.warn(`Released ${released} stale outbox events`);
  }

  @Interval('outbox-cleanup', 3600_000)
  async cleanup(): Promise<void> {
    await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM outbox_events WHERE status = 'DONE' AND "processedAt" < now() - make_interval(days => ${RETENTION_DAYS})`);
  }
}
