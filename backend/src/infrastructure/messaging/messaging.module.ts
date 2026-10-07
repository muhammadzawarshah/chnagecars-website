import { Global, Injectable, Logger, Module } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { AppConfig } from '../../config/app-config.service';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** Email delivery. Without SMTP_URL messages are logged (development). */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transport: Transporter | null;
  private readonly from: string;

  constructor(config: AppConfig) {
    const url = config.get('SMTP_URL');
    this.transport = url ? nodemailer.createTransport(url) : null;
    this.from = config.get('MAIL_FROM');
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.transport) {
      this.logger.log({ to: message.to, subject: message.subject, text: message.text }, 'Email (log transport)');
      return;
    }
    await this.transport.sendMail({ from: this.from, ...message });
  }
}

export interface SmsMessage {
  to: string;
  body: string;
}

/** SMS delivery. Only a log provider exists until a gateway (e.g. Clickatell, Twilio) is integrated. */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async send(message: SmsMessage): Promise<void> {
    this.logger.log({ to: message.to, body: message.body }, 'SMS (log provider)');
  }
}

@Global()
@Module({ providers: [MailService, SmsService], exports: [MailService, SmsService] })
export class MessagingModule {}
