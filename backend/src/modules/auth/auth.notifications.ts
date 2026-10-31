import { MAIN_APP } from '../customer-apps/app-context';
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
      const user = await this.prisma.user.findUnique({ where: { id: event.payload.userId }, include: { application: true } });
      if (!user) return;
      const appName = user.application?.name ?? this.config.get('APP_NAME');
      const website = user.appId && user.appId !== MAIN_APP && user.application?.resetUrl ? new URL(user.application.resetUrl).origin : this.config.get('PUBLIC_WEB_URL');
      await this.mail.send({
        to: user.email,
        subject: `Welcome to ${appName}`,
        text: `Hi ${user.firstName},\n\nYour account is ready. Search new and used vehicles, save favourites and get alerts at ${website}.\n`,
      });
    });

    this.outbox.on(
      OutboxEvents.PasswordResetRequested,
      'auth.reset-email',
      async (event) => {
        const user = await this.prisma.user.findUnique({ where: { id: event.payload.userId }, include: { application: true } });
        if (!user || !event.payload.token) return;
        if (user.appId !== MAIN_APP && !user.application?.resetUrl) throw new Error('App reset URL is not configured');
        const url = new URL(user.appId !== MAIN_APP ? user.application!.resetUrl! : `${this.config.get('PUBLIC_WEB_URL')}/reset-password`);
        url.searchParams.set('token', event.payload.token);
        if (user.appId !== MAIN_APP) url.searchParams.set('appId', user.appId);
        const link = url.toString();
        await this.mail.send({
          to: user.email,
          subject: `Reset your ${user.application?.name ?? this.config.get('APP_NAME')} password`,
          text: `Hi ${user.firstName},\n\nUse this link to reset your password (valid for ${event.payload.ttlMinutes} minutes):\n${link}\n\nIf you did not request this, ignore this email.\n`,
        });
      },
      { sensitive: true },
    );
  }
}
