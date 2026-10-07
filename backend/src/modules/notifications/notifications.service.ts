import { Injectable, Logger } from '@nestjs/common';
import { DealerMemberStatus, DealerPermission, NotificationChannel, Prisma, UserRole, UserStatus } from '../../generated/prisma/client';
import { pageArgs, toPage } from '../../common/dto/pagination.dto';
import { Errors } from '../../common/errors/app-error';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { MailService, SmsService } from '../../infrastructure/messaging/messaging.module';
import { effectivePermissions } from '../dealers/dealer-permissions';
import { ALL_NOTIFICATION_TYPES, DEFAULT_CHANNELS, NotificationType } from './notification-types';

export interface NotifyInput {
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  /** Email subject override; email body defaults to `body`. */
  emailSubject?: string;
}

/**
 * Central notification delivery (FR-36/FR-57). Called from outbox handlers in the worker,
 * so delivery never blocks a user request. Respects each user's channel preferences.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly sms: SmsService,
  ) {}

  async notify(input: NotifyInput): Promise<void> {
    const userIds = [...new Set(input.userIds)].filter(Boolean);
    if (!userIds.length) return;

    const [users, prefs] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: userIds }, status: UserStatus.ACTIVE },
        select: { id: true, email: true, phone: true },
      }),
      this.prisma.notificationPreference.findMany({ where: { userId: { in: userIds }, eventType: input.type } }),
    ]);

    const enabled = (userId: string, channel: NotificationChannel) =>
      prefs.find((pref) => pref.userId === userId && pref.channel === channel)?.enabled ?? DEFAULT_CHANNELS[channel];

    const inApp = users.filter((user) => enabled(user.id, NotificationChannel.IN_APP));
    if (inApp.length) {
      await this.prisma.notification.createMany({
        data: inApp.map((user) => ({
          userId: user.id,
          type: input.type,
          title: input.title,
          body: input.body,
          data: (input.data ?? {}) as Prisma.InputJsonValue,
        })),
      });
    }

    for (const user of users) {
      if (enabled(user.id, NotificationChannel.EMAIL)) {
        await this.mail.send({ to: user.email, subject: input.emailSubject ?? input.title, text: input.body });
      }
      if (user.phone && enabled(user.id, NotificationChannel.SMS)) {
        await this.sms.send({ to: user.phone, body: `${input.title}: ${input.body}`.slice(0, 300) });
      }
    }
  }

  /** Email someone who has no account (guest enquiry / guest sell request). */
  async emailGuest(email: string, subject: string, text: string): Promise<void> {
    await this.mail.send({ to: email, subject, text });
  }

  /** Active dealership members holding a permission (e.g. who should hear about a new enquiry). */
  async dealerRecipients(dealerId: string, permission: DealerPermission, branchId?: string | null): Promise<string[]> {
    const members = await this.prisma.dealerMember.findMany({
      where: { dealerId, status: DealerMemberStatus.ACTIVE },
      select: { userId: true, role: true, extraPermissions: true, branchId: true },
    });
    return members
      .filter((member) => effectivePermissions(member.role, member.extraPermissions).includes(permission))
      .filter((member) => !branchId || !member.branchId || member.branchId === branchId || member.role === 'OWNER' || member.role === 'MANAGER')
      .map((member) => member.userId);
  }

  async adminRecipients(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] }, status: UserStatus.ACTIVE },
      select: { id: true },
      take: 200,
    });
    return admins.map((admin) => admin.id);
  }

  // ───── user-facing API ─────

  async list(userId: string, query: { page?: number; pageSize?: number; unreadOnly?: boolean }) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where: Prisma.NotificationWhereInput = { userId, ...(query.unreadOnly ? { readAt: null } : {}) };
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.notification.count({ where }),
    ]);
    return toPage(data, total, page, pageSize);
  }

  async unreadCount(userId: string): Promise<{ unread: number }> {
    return { unread: await this.prisma.notification.count({ where: { userId, readAt: null } }) };
  }

  async markRead(userId: string, id: string): Promise<void> {
    const result = await this.prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
    if (!result.count) {
      const exists = await this.prisma.notification.count({ where: { id, userId } });
      if (!exists) throw Errors.notFound('Notification');
    }
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { updated: result.count };
  }

  async preferences(userId: string) {
    const prefs = await this.prisma.notificationPreference.findMany({ where: { userId } });
    return ALL_NOTIFICATION_TYPES.map((eventType) => ({
      eventType,
      channels: Object.values(NotificationChannel).reduce(
        (acc, channel) => ({
          ...acc,
          [channel]: prefs.find((pref) => pref.eventType === eventType && pref.channel === channel)?.enabled ?? DEFAULT_CHANNELS[channel],
        }),
        {} as Record<NotificationChannel, boolean>,
      ),
    }));
  }

  async updatePreferences(userId: string, items: { eventType: string; channel: NotificationChannel; enabled: boolean }[]) {
    for (const item of items) {
      if (!ALL_NOTIFICATION_TYPES.includes(item.eventType as NotificationType)) {
        throw Errors.badRequest('UNKNOWN_NOTIFICATION_TYPE', `Unknown notification type ${item.eventType}`);
      }
    }
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.notificationPreference.upsert({
          where: { userId_eventType_channel: { userId, eventType: item.eventType, channel: item.channel } },
          create: { userId, eventType: item.eventType, channel: item.channel, enabled: item.enabled },
          update: { enabled: item.enabled },
        }),
      ),
    );
    return this.preferences(userId);
  }
}
