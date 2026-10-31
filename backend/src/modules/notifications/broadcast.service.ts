import { Injectable, OnModuleInit } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { Prisma, UserRole } from '../../generated/prisma/client';
import type { AuthUser } from '../../common/types/auth-user';
import { Errors } from '../../common/errors/app-error';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { BroadcastNotificationDto } from './dto/notification.dto';
import { NotificationsGateway } from './notifications.gateway';
import { PushService } from './push.service';
import { NotificationTypes } from './notification-types';

// Stable UUIDs make retrying a campaign safe for persisted notifications and delivery jobs.
function stableId(value: string) {
  const bytes = createHash('sha256').update(value).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

@Injectable()
export class BroadcastService implements OnModuleInit {
  constructor(private readonly db: PrismaService, private readonly outbox: OutboxService,
    private readonly audit: AuditService, private readonly live: NotificationsGateway, private readonly push: PushService) {}

  private audience(dto: BroadcastNotificationDto): Prisma.UserWhereInput {
    return { appId: dto.appId ?? 'changecars', status: 'ACTIVE', application: { enabled: true }, role: { in: dto.audience === 'customers' ? [UserRole.CUSTOMER]
      : dto.audience === 'dealers' ? [UserRole.DEALER] : [UserRole.CUSTOMER, UserRole.DEALER] },
      ...(dto.audience === 'selected' ? { id: { in: dto.userIds ?? [] } } : {}) };
  }

  async queue(actor: AuthUser, dto: BroadcastNotificationDto) {
    if (dto.audience === 'selected' && !dto.userIds?.length) throw Errors.badRequest('RECIPIENTS_REQUIRED', 'Choose at least one user');
    if (dto.audience !== 'selected' && dto.userIds?.length) throw Errors.badRequest('INVALID_AUDIENCE', 'User IDs apply only to selected users');
    const recipients = await this.db.user.count({ where: this.audience(dto) });
    if (!recipients) throw Errors.badRequest('NO_RECIPIENTS', 'No active users match this audience');
    const campaignId = randomUUID();
    await this.db.$transaction(async tx => {
      await this.outbox.enqueue(tx, { type: OutboxEvents.NotificationBroadcast, aggregateType: 'NotificationCampaign',
        aggregateId: campaignId, payload: { ...dto, campaignId, queuedAt: new Date().toISOString() } });
      await this.audit.record({ action: 'notification.broadcast', entityType: 'NotificationCampaign', entityId: campaignId,
        actorId: actor.id, actorRole: actor.role, after: { ...dto, recipients } }, tx);
    });
    return { campaignId, recipients, status: 'queued', pushConfigured: this.push.configured };
  }

  onModuleInit() {
    this.outbox.on(OutboxEvents.NotificationBroadcast, 'notifications.broadcast', async event => {
      const dto = event.payload as BroadcastNotificationDto & { campaignId: string; queuedAt: string };
      let cursor: string | undefined;
      while (true) {
        const users = await this.db.user.findMany({ where: { ...this.audience(dto), createdAt: { lte: new Date(dto.queuedAt) },
          ...(cursor ? { id: { ...(dto.audience === 'selected' ? { in: dto.userIds } : {}), gt: cursor } } : {}) },
          orderBy: { id: 'asc' }, take: 250, select: { id: true } });
        if (!users.length) break;
        const disabled = await this.db.notificationPreference.findMany({ where: { userId: { in: users.map(u => u.id) },
          eventType: NotificationTypes.Announcement, channel: 'IN_APP', enabled: false }, select: { userId: true } });
        const excluded = new Set(disabled.map(p => p.userId));
        const notifications = users.filter(u => !excluded.has(u.id)).map(user => ({
          id: stableId(`${dto.campaignId}:${user.id}`), userId: user.id, type: NotificationTypes.Announcement,
          title: dto.title, body: dto.body, data: { campaignId: dto.campaignId },
        }));
        await this.db.$transaction(async tx => {
          await tx.notification.createMany({ data: notifications, skipDuplicates: true });
          await tx.outboxEvent.createMany({ skipDuplicates: true, data: notifications.map(n => ({
            id: stableId(`delivery:${n.id}`), type: OutboxEvents.NotificationDeliver, aggregateType: 'Notification',
            aggregateId: n.id, payload: { notificationId: n.id },
          })) });
        });
        cursor = users[users.length - 1].id;
      }
    });
    this.outbox.on(OutboxEvents.NotificationDeliver, 'notifications.deliver', async event => {
      const notification = await this.db.notification.findUnique({ where: { id: String(event.payload.notificationId) } });
      if (!notification) return;
      const user = await this.db.user.findFirst({ where: { id: notification.userId, status: 'ACTIVE', application: { enabled: true } }, select: { id: true } });
      if (!user) return;
      const preference = await this.db.notificationPreference.findUnique({ where: { userId_eventType_channel: {
        userId: user.id, eventType: notification.type, channel: 'IN_APP' } } });
      if (preference?.enabled === false) return;
      await this.live.publish(user.id, notification);
      await this.push.send(user.id, notification);
    });
  }
}
