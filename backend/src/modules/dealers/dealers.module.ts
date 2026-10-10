import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import { DealerMemberRole } from '../../generated/prisma/client';
import { AppConfig } from '../../config/app-config.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { MailService } from '../../infrastructure/messaging/messaging.module';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationTypes } from '../notifications/notification-types';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminDealersController, DealerPortalController, PublicDealersController } from './dealers.controller';
import { DealersService } from './dealers.service';

@Injectable()
class DealerNotifications implements OnModuleInit {
  constructor(
    private readonly outbox: OutboxService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    private readonly config: AppConfig,
  ) {}

  onModuleInit(): void {
    this.outbox.on(OutboxEvents.DealerRegistered, 'dealers.notify-admins', async (event) => {
      const dealer = await this.prisma.dealer.findUnique({ where: { id: event.payload.dealerId } });
      if (!dealer) return;
      await this.notifications.notify({
        userIds: await this.notifications.adminRecipients(),
        type: NotificationTypes.DealerApplication,
        title: 'New dealer registered',
        body: `${dealer.name} (${dealer.city}) registered and is active.`,
        data: { dealerId: dealer.id },
      });
    });

    this.outbox.on(OutboxEvents.DealerStatusChanged, 'dealers.notify-owner', async (event) => {
      const owners = await this.prisma.dealerMember.findMany({
        where: { dealerId: event.payload.dealerId, role: DealerMemberRole.OWNER },
        select: { userId: true },
      });
      const reason = event.payload.reason ? ` Reason: ${event.payload.reason}` : '';
      await this.notifications.notify({
        userIds: owners.map((owner) => owner.userId),
        type: NotificationTypes.DealerStatus,
        title: `Dealership ${String(event.payload.to).toLowerCase()}`,
        body: `Your dealership status changed from ${event.payload.from} to ${event.payload.to}.${reason}`,
        data: event.payload,
      });
    });

    this.outbox.on(
      OutboxEvents.DealerMemberInvited,
      'dealers.invite-email',
      async (event) => {
        const member = await this.prisma.dealerMember.findUnique({
          where: { id: event.payload.memberId },
          include: { user: true, dealer: { select: { name: true } } },
        });
        if (!member || !event.payload.token) return;
        const link = `${this.config.get('PUBLIC_WEB_URL')}/reset-password?token=${encodeURIComponent(event.payload.token)}&invite=1`;
        await this.mail.send({
          to: member.user.email,
          subject: `You have been invited to ${member.dealer.name} on ${this.config.get('APP_NAME')}`,
          text: `Hi ${member.user.firstName},\n\n${member.dealer.name} added you as ${member.role.toLowerCase()}. Set your password to get started (link valid for 7 days):\n${link}\n`,
        });
      },
      { sensitive: true },
    );
  }
}

@Module({
  imports: [AuthModule],
  controllers: [PublicDealersController, DealerPortalController, AdminDealersController],
  providers: [DealersService, DealerNotifications],
  exports: [DealersService],
})
export class DealersModule {}
