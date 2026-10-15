import { Body, Controller, Get, Injectable, Module, OnModuleInit, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '../../generated/prisma/client';
import { CurrentUser, OptionalAuth, Roles } from '../../common/decorators/auth.decorators';
import type { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { NotificationTypes } from '../notifications/notification-types';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AdminSellStatusDto,
  ConfirmSellImageDto,
  CreateSellRequestDto,
  ManualValuationDto,
  SellImageUploadDto,
  SellRequestQueryDto,
} from './dto/selling.dto';
import { SellingService } from './selling.service';

@ApiTags('Sell / value your vehicle')
@Controller('sell-requests')
export class PublicSellingController {
  constructor(private readonly selling: SellingService) {}

  @OptionalAuth()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  @ApiOperation({ summary: 'Submit your vehicle for a valuation or to receive dealer offers (FR-08, FR-09)' })
  create(@Body() dto: CreateSellRequestDto, @CurrentUser() user?: AuthUser) {
    return this.selling.create(dto, user);
  }
}

@ApiTags('Customer: my vehicles for sale')
@ApiBearerAuth()
@Controller('me/sell-requests')
export class MySellRequestsController {
  constructor(private readonly selling: SellingService) {}

  @Get()
  @ApiOperation({ summary: 'My valuations and sell requests (FR-40)' })
  list(@CurrentUser() user: AuthUser, @Query() query: SellRequestQueryDto) {
    return this.selling.listMine(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Valuations, bidding status and every dealer offer with its history' })
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.selling.getMine(user.id, id);
  }

  @Post(':id/request-offers')
  @ApiOperation({ summary: 'Ask ChangeCars to collect offers from the dealer network' })
  requestOffers(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.selling.requestOffers(user.id, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.selling.cancelMine(user.id, id);
  }

  @Post(':id/images/upload-url')
  imageUploadUrl(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SellImageUploadDto) {
    return this.selling.imageUploadUrl(user.id, id, dto);
  }

  @Post(':id/images')
  confirmImage(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ConfirmSellImageDto) {
    return this.selling.confirmImage(user.id, id, dto);
  }
}

@ApiTags('Admin: sell requests')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/sell-requests')
export class AdminSellingController {
  constructor(private readonly selling: SellingService) {}

  @Get()
  list(@Query() query: SellRequestQueryDto) {
    return this.selling.adminList(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.selling.adminGet(id);
  }

  @Post(':id/valuations')
  @ApiOperation({ summary: 'Record a manual valuation' })
  valuation(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ManualValuationDto, @CurrentUser() admin: AuthUser) {
    return this.selling.manualValuation(id, dto, admin.id);
  }

  @Patch(':id/status')
  status(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdminSellStatusDto) {
    return this.selling.adminSetStatus(id, dto);
  }
}

@Injectable()
class SellingEventHandlers implements OnModuleInit {
  constructor(
    private readonly outbox: OutboxService,
    private readonly prisma: PrismaService,
    private readonly selling: SellingService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    this.outbox.on(OutboxEvents.SellRequestCreated, 'selling.confirm-and-value', async (event) => {
      const request = await this.prisma.sellRequest.findUnique({ where: { id: event.payload.sellRequestId } });
      if (!request) return;
      await this.selling.autoValue(request.id);
      await this.notifications.emailGuest(
        request.email,
        `We received your vehicle details (${request.reference})`,
        `Hi ${request.name},\n\nThanks for submitting your ${request.year} ${request.makeName} ${request.modelName}. Your reference is ${request.reference}. We will send your valuation shortly.\n`,
      );
    });

    this.outbox.on(OutboxEvents.ValuationCompleted, 'selling.valuation-ready', async (event) => {
      const [request, valuation] = await Promise.all([
        this.prisma.sellRequest.findUnique({ where: { id: event.payload.sellRequestId } }),
        this.prisma.valuation.findUnique({ where: { id: event.payload.valuationId } }),
      ]);
      if (!request || !valuation) return;
      const rand = (value: number) => `R${value.toLocaleString('en-ZA')}`;
      const title = 'Your vehicle valuation is ready';
      const body = `Estimated trade value for your ${request.year} ${request.makeName} ${request.modelName}: ${rand(valuation.estimateLow)} to ${rand(valuation.estimateHigh)} (most likely ${rand(valuation.estimateMid)}). Reference ${request.reference}.`;
      if (request.customerId) {
        await this.notifications.notify({ userIds: [request.customerId], type: NotificationTypes.ValuationReady, title, body, data: { sellRequestId: request.id, valuationId: valuation.id } });
      } else {
        await this.notifications.emailGuest(request.email, title, `Hi ${request.name},\n\n${body}\n`);
      }
    });
  }
}

@Module({
  controllers: [PublicSellingController, MySellRequestsController, AdminSellingController],
  providers: [SellingService, SellingEventHandlers],
  exports: [SellingService],
})
export class SellingModule {}
