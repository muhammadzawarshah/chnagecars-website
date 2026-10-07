import { Global, Injectable, Logger, Module } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import type { Db } from '../database';
import type { OutboxEventType } from './outbox.events';

export interface OutboxMessage {
  type: OutboxEventType;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  /** Delay delivery (e.g. reminders). */
  availableAt?: Date;
}

export interface OutboxRecord {
  id: string;
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, any>;
  attempts: number;
}

export type OutboxHandler = (event: OutboxRecord) => Promise<void>;

export interface OutboxHandlerEntry {
  handler: OutboxHandler;
  name: string;
  /** Payload contains secrets (e.g. reset tokens): scrub it after successful delivery. */
  sensitive: boolean;
}

/**
 * Write side: enqueue inside the same transaction as the business change, so the event
 * exists if and only if the change committed. Read side: modules register handlers;
 * the worker dispatches with at-least-once semantics, so handlers must be idempotent.
 */
@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  private readonly handlers = new Map<string, OutboxHandlerEntry[]>();

  async enqueue(db: Db, ...messages: OutboxMessage[]): Promise<void> {
    if (!messages.length) return;
    await db.outboxEvent.createMany({
      data: messages.map((message) => ({
        type: message.type,
        aggregateType: message.aggregateType,
        aggregateId: message.aggregateId,
        payload: message.payload as Prisma.InputJsonValue,
        availableAt: message.availableAt ?? new Date(),
      })),
    });
  }

  on(type: OutboxEventType, name: string, handler: OutboxHandler, options: { sensitive?: boolean } = {}): void {
    const list = this.handlers.get(type) ?? [];
    if (list.some((entry) => entry.name === name)) return;
    list.push({ handler, name, sensitive: options.sensitive ?? false });
    this.handlers.set(type, list);
    this.logger.debug(`handler ${name} registered for ${type}`);
  }

  handlersFor(type: string): OutboxHandlerEntry[] {
    return this.handlers.get(type) ?? [];
  }
}

@Global()
@Module({ providers: [OutboxService], exports: [OutboxService] })
export class OutboxModule {}
