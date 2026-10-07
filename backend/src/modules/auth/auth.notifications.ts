import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppConfig } from '../../config/app-config.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { MailService } from '../../infrastructure/messaging/messaging.module';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';

/** Account emails. Security emails bypass notification preferences on purpose. */
@Injectable()
export class AuthNotifications implements OnModuleInit {
  constructor(
    private readonly outbox: OutboxService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: AppConfig,
  ) {}

  onModuleInit(): void {
    this.outbox.on(OutboxEvents.UserRegistered, 'auth.welcome-email', async (event) => {
      const user = await this.prisma.user.findUnique({ where: { id: event.payload.userId } });
      if (!user) return;
      await this.mail.send({
        to: user.email,
        subject: `Welcome to ${this.config.get('APP_NAME')}`,
        text: `Hi ${user.firstName},\n\nYour account is ready. Search new and used vehicles, save favourites and get alerts at ${this.config.get('PUBLIC_WEB_URL')}.\n`,
      });
    });

    this.outbox.on(
      OutboxEvents.PasswordResetRequested,
      'auth.reset-email',
      async (event) => {
        const user = await this.prisma.user.findUnique({ where: { id: event.payload.userId } });
        if (!user || !event.payload.token) return;
        const link = `${this.config.get('PUBLIC_WEB_URL')}/reset-password?token=${encodeURIComponent(event.payload.token)}`;
        await this.mail.send({
          to: user.email,
          subject: 'Reset your password',
          text: `Hi ${user.firstName},\n\nUse this link to reset your password (valid for ${event.payload.ttlMinutes} minutes):\n${link}\n\nIf you did not request this, ignore this email.\n`,
        });
      },
      { sensitive: true },
    );
  }
}
