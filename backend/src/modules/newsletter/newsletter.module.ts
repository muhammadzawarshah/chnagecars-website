import { Body, Controller, Get, HttpCode, HttpStatus, Injectable, Module, OnModuleInit, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import type { Response } from 'express';
import { Prisma, SubscriberStatus, UserRole } from '../../generated/prisma/client';
import { AppConfig } from '../../config/app-config.service';
import { OptionalAuth, Public, Roles, CurrentUser } from '../../common/decorators/auth.decorators';
import { pageArgs, PaginationQueryDto, toPage } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/types/auth-user';
import { normalizeEmail, randomToken } from '../../common/utils/strings';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { MailService } from '../../infrastructure/messaging/messaging.module';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';

export class SubscribeDto {
  @ApiProperty() @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value)) @IsEmail() @MaxLength(254) email: string;
  @ApiPropertyOptional({ example: 'footer' }) @IsOptional() @IsString() @MaxLength(60) source?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString() @MaxLength(80) firstName?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString() @MaxLength(80) lastName?: string;
}

export class UnsubscribeDto {
  @ApiProperty() @IsString() @Length(10, 200) token: string;
}

export class SubscriberQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SubscriberStatus }) @IsOptional() @IsEnum(SubscriberStatus) status?: SubscriberStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) q?: string;
}

/** CSV cell: quoted, and neutralised so spreadsheet apps never evaluate it as a formula. */
const csvCell = (value: string) => {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** FR-32: collect, validate and store subscriptions; unsubscribe by token; admin management. */
@Injectable()
export class NewsletterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly audit: AuditService,
  ) {}

  async subscribe(dto: SubscribeDto, userId?: string) {
    const email = normalizeEmail(dto.email);
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.newsletterSubscriber.findUnique({ where: { email } });
      if (existing?.status === SubscriberStatus.SUBSCRIBED) return { status: existing.status };
      const subscriber = existing
        ? await tx.newsletterSubscriber.update({ where: { email }, data: { status: SubscriberStatus.SUBSCRIBED, consentAt: new Date(), unsubscribedAt: null, source: dto.source, firstName: dto.firstName ?? existing.firstName, lastName: dto.lastName ?? existing.lastName } })
        : await tx.newsletterSubscriber.create({ data: { email, source: dto.source, firstName: dto.firstName, lastName: dto.lastName, userId, unsubscribeToken: randomToken(24) } });
      await this.outbox.enqueue(tx, { type: OutboxEvents.NewsletterSubscribed, aggregateType: 'newsletter_subscriber', aggregateId: subscriber.id, payload: { subscriberId: subscriber.id } });
      return { status: subscriber.status };
    });
  }

  async unsubscribe(token: string) {
    const result = await this.prisma.newsletterSubscriber.updateMany({
      where: { unsubscribeToken: token, status: SubscriberStatus.SUBSCRIBED },
      data: { status: SubscriberStatus.UNSUBSCRIBED, unsubscribedAt: new Date() },
    });
    return { unsubscribed: result.count > 0 };
  }

  private where(query: SubscriberQueryDto): Prisma.NewsletterSubscriberWhereInput {
    return { ...(query.status ? { status: query.status } : {}), ...(query.q ? { email: { contains: query.q.toLowerCase() } } : {}) };
  }

  async list(query: SubscriberQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where = this.where(query);
    const [rows, total] = await Promise.all([
      this.prisma.newsletterSubscriber.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, omit: { unsubscribeToken: true } }),
      this.prisma.newsletterSubscriber.count({ where }),
    ]);
    return toPage(rows, total, page, pageSize);
  }

  /** Streams subscribers as CSV in batches (bounded memory). */
  async exportCsv(res: Response, query: SubscriberQueryDto, adminId: string) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="newsletter-subscribers.csv"');
    res.write('email,status,source,subscribed_at,unsubscribed_at\n');
    let cursor: string | undefined;
    for (;;) {
      const batch = await this.prisma.newsletterSubscriber.findMany({
        where: this.where(query),
        orderBy: { id: 'asc' },
        take: 1000,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });
      for (const row of batch) {
        const cells = [row.email, row.status, row.source ?? '', row.consentAt.toISOString(), row.unsubscribedAt?.toISOString() ?? ''];
        res.write(`${cells.map(csvCell).join(',')}\n`);
      }
      if (batch.length < 1000) break;
      cursor = batch[batch.length - 1].id;
    }
    res.end();
    await this.audit.record({ action: 'newsletter.export', entityType: 'newsletter', actorId: adminId });
  }
}

@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @OptionalAuth()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  subscribe(@Body() dto: SubscribeDto, @CurrentUser() user?: AuthUser) {
    return this.newsletter.subscribe(dto, user?.id);
  }

  @Public()
  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe with the token from any newsletter email' })
  unsubscribe(@Body() dto: UnsubscribeDto) {
    return this.newsletter.unsubscribe(dto.token);
  }
}

@ApiTags('Admin: newsletter')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/newsletter')
export class AdminNewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Get('subscribers')
  list(@Query() query: SubscriberQueryDto) {
    return this.newsletter.list(query);
  }

  @Get('subscribers.csv')
  export(@Query() query: SubscriberQueryDto, @Res() res: Response, @CurrentUser() admin: AuthUser) {
    return this.newsletter.exportCsv(res, query, admin.id);
  }
}

@Injectable()
class NewsletterNotifications implements OnModuleInit {
  constructor(
    private readonly outbox: OutboxService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: AppConfig,
  ) {}

  onModuleInit(): void {
    this.outbox.on(OutboxEvents.NewsletterSubscribed, 'newsletter.welcome', async (event) => {
      const subscriber = await this.prisma.newsletterSubscriber.findUnique({ where: { id: event.payload.subscriberId } });
      if (!subscriber || subscriber.status !== SubscriberStatus.SUBSCRIBED) return;
      const unsubscribe = `${this.config.get('PUBLIC_WEB_URL')}/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}`;
      await this.mail.send({
        to: subscriber.email,
        subject: `You're subscribed to ${this.config.get('APP_NAME')} news`,
        text: `Thanks for subscribing. You'll receive motoring news, reviews and specials.\n\nUnsubscribe any time: ${unsubscribe}\n`,
      });
    });
  }
}

@Module({
  controllers: [NewsletterController, AdminNewsletterController],
  providers: [NewsletterService, NewsletterNotifications],
  exports: [NewsletterService],
})
export class NewsletterModule {}
