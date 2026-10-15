import { Global, Injectable, Module } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { requestContext } from '../../common/context/request-context';
import type { Db } from '../database';
import { PrismaService } from '../database/prisma.service';

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  /** Override the actor (e.g. system jobs). Defaults to the request user. */
  actorId?: string | null;
  actorRole?: string | null;
}

const json = (value: unknown) =>
  value === undefined || value === null ? Prisma.JsonNull : (JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue);

/** BR-13: records who did what, when, from where, with previous and new values. */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pass the transaction client so the audit row commits atomically with the change. */
  async record(entry: AuditEntry, db: Db = this.prisma): Promise<void> {
    const ctx = requestContext();
    await db.auditLog.create({
      data: {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        before: json(entry.before),
        after: json(entry.after),
        actorId: entry.actorId === undefined ? ctx.user?.id ?? null : entry.actorId,
        actorRole: entry.actorRole === undefined ? ctx.user?.role ?? null : entry.actorRole,
        ip: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
        requestId: ctx.requestId ?? null,
      },
    });
  }
}

@Global()
@Module({ providers: [AuditService], exports: [AuditService] })
export class AuditModule {}
