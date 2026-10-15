import { Body, Controller, Get, HttpCode, HttpStatus, Injectable, Logger, Module, OnModuleInit, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DealerPermission, UserRole } from '../../generated/prisma/client';
import { CurrentUser, Roles } from '../../common/decorators/auth.decorators';
import { Idempotent } from '../../common/interceptors/idempotency.interceptor';
import type { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxRecord, OutboxService } from '../../infrastructure/outbox/outbox.service';
import { CrmModule } from '../crm/crm.module';
import { CurrentDealer, DealerAccess, DealerContext } from '../dealers/dealer-access';
import { NotificationTypes } from '../notifications/notification-types';
import { NotificationsService } from '../notifications/notifications.service';
import { BiddingService } from './bidding.service';
import {
  CounterOfferDto,
  CounterResponseDto,
  DealerOfferQueryDto,
  DealerSessionQueryDto,
  OpenBiddingDto,
  RejectOfferDto,
  ReopenBiddingDto,
  SubmitOfferDto,
  UpdateOfferDto,
} from './dto/bidding.dto';

@ApiTags('Admin: bidding')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminBiddingController {
  constructor(private readonly bidding: BiddingService) {}

  @Get('bidding-sessions')
  list(@Query() query: DealerSessionQueryDto) {
    return this.bidding.adminListSessions(query);
  }

  @Post('sell-requests/:id/bidding-sessions')
  @ApiOperation({ summary: 'Publish a vehicle to the dealer network with explicit bidding rules (FR-10, FR-52)' })
  open(@Param('id', ParseUUIDPipe) id: string, @Body() dto: OpenBiddingDto, @CurrentUser() admin: AuthUser) {
    return this.bidding.openSession(id, dto, admin.id);
  }

  @Post('bidding-sessions/:id/reopen')
  @ApiOperation({ summary: 'Explicitly reopen a closed bidding process (BR-07)' })
  reopen(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReopenBiddingDto) {
    return this.bidding.reopen(id, dto);
  }

  @Post('bidding-sessions/:id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectOfferDto) {
    return this.bidding.cancelSession(id, dto.reason);
  }
}

@ApiTags('Dealer portal: bidding')
@ApiBearerAuth()
@Controller('dealer')
export class DealerBiddingController {
  constructor(private readonly bidding: BiddingService) {}

  @Get('bidding/sessions')
  @DealerAccess({ permissions: [DealerPermission.BIDDING_VIEW], requireApproved: true })
  @ApiOperation({ summary: 'Vehicles open for bidding that my dealership is eligible for (BR-06)' })
  sessions(@CurrentDealer() dealer: DealerContext, @Query() query: DealerSessionQueryDto) {
    return this.bidding.listSessionsForDealer(dealer, query);
  }

  @Get('bidding/sessions/:id')
  @DealerAccess({ permissions: [DealerPermission.BIDDING_VIEW], requireApproved: true })
  session(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.bidding.getSessionForDealer(dealer, id);
  }

  @Post('bidding/sessions/:id/offers')
  @DealerAccess({ permissions: [DealerPermission.BIDDING_PARTICIPATE], requireApproved: true })
  @ApiOperation({ summary: 'Submit (or revise/renew) this dealership’s offer' })
  submit(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SubmitOfferDto) {
    return this.bidding.submitOffer(dealer, id, dto);
  }

  @Get('offers')
  @DealerAccess({ permissions: [DealerPermission.BIDDING_VIEW] })
  @ApiOperation({ summary: 'My dealership’s offers (FR-13 manage offers)' })
  offers(@CurrentDealer() dealer: DealerContext, @Query() query: DealerOfferQueryDto) {
    return this.bidding.listOffersForDealer(dealer, query);
  }

  @Patch('offers/:id')
  @DealerAccess({ permissions: [DealerPermission.BIDDING_PARTICIPATE], requireApproved: true })
  @ApiOperation({ summary: 'Revise an offer; full history is kept (BR-08)' })
  update(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOfferDto) {
    return this.bidding.updateOffer(dealer, id, dto);
  }

  @Post('offers/:id/withdraw')
  @DealerAccess({ permissions: [DealerPermission.BIDDING_PARTICIPATE] })
  withdraw(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.bidding.withdraw(dealer, id);
  }

  @Post('offers/:id/counter-response')
  @DealerAccess({ permissions: [DealerPermission.BIDDING_PARTICIPATE] })
  @ApiOperation({ summary: 'Accept or decline the customer’s counter-offer (FR-56)' })
  counterResponse(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CounterResponseDto) {
    return this.bidding.respondToCounter(dealer, id, dto);
  }
}

@ApiTags('Customer: offers')
@ApiBearerAuth()
@Controller('me/offers')
export class MyOffersController {
  constructor(private readonly bidding: BiddingService) {}

  @Get()
  @ApiOperation({ summary: 'Dealer offers on my vehicles (FR-10, FR-40)' })
  list(@CurrentUser() user: AuthUser, @Query() query: DealerOfferQueryDto) {
    return this.bidding.listMyOffers(user.id, query);
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @Idempotent()
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'Retry-safe acceptance' })
  @ApiOperation({ summary: 'Accept an offer (FR-54). Creates the deal and supersedes all other offers atomically.' })
  accept(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.bidding.accept(user.id, id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectOfferDto) {
    return this.bidding.reject(user.id, id, dto.reason);
  }

  @Post(':id/counter')
  @ApiOperation({ summary: 'Counter an offer with a higher amount (FR-56)' })
  counter(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CounterOfferDto) {
    return this.bidding.counter(user.id, id, dto);
  }
}

const rand = (value: number) => `R${value.toLocaleString('en-ZA')}`;

@Injectable()
class BiddingNotifications implements OnModuleInit {
  constructor(
    private readonly outbox: OutboxService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly bidding: BiddingService,
  ) {}

  private loadOffer(id: string) {
    return this.prisma.offer.findUnique({
      where: { id },
      include: { dealer: { select: { id: true, name: true } }, session: { include: { sellRequest: true } } },
    });
  }

  private vehicleName(request: { year: number; makeName: string; modelName: string }) {
    return `${request.year} ${request.makeName} ${request.modelName}`;
  }

  private async toCustomer(request: { customerId: string | null; email: string; name: string }, type: (typeof NotificationTypes)[keyof typeof NotificationTypes], title: string, body: string, data: Record<string, unknown>) {
    if (request.customerId) await this.notifications.notify({ userIds: [request.customerId], type, title, body, data });
    else await this.notifications.emailGuest(request.email, title, `Hi ${request.name},\n\n${body}\n`);
  }

  private async toDealer(dealerId: string, type: (typeof NotificationTypes)[keyof typeof NotificationTypes], title: string, body: string, data: Record<string, unknown>) {
    await this.notifications.notify({ userIds: await this.notifications.dealerRecipients(dealerId, DealerPermission.BIDDING_PARTICIPATE), type, title, body, data });
  }

  onModuleInit(): void {
    this.outbox.on(OutboxEvents.BiddingOpened, 'bidding.notify-dealers', async (event) => {
      const session = await this.prisma.biddingSession.findUnique({ where: { id: event.payload.sessionId }, include: { sellRequest: true } });
      if (!session) return;
      const dealerIds = await this.bidding.eligibleDealerIds(session.id);
      const userIds = (await Promise.all(dealerIds.map((id) => this.notifications.dealerRecipients(id, DealerPermission.BIDDING_VIEW)))).flat();
      await this.notifications.notify({
        userIds,
        type: NotificationTypes.BiddingOpened,
        title: 'New vehicle open for offers',
        body: `${this.vehicleName(session.sellRequest)}, ${session.sellRequest.mileage.toLocaleString('en-ZA')} km in ${session.sellRequest.province.replace('_', ' ')}. Bidding closes ${session.closesAt.toISOString()}.`,
        data: { sessionId: session.id },
      });
    });

    const offerToCustomer = (name: string, title: (offer: NonNullable<Awaited<ReturnType<BiddingNotifications['loadOffer']>>>) => string) =>
      async (event: OutboxRecord) => {
        const offer = await this.loadOffer(event.payload.offerId);
        if (!offer) return;
        const request = offer.session.sellRequest;
        await this.toCustomer(request, NotificationTypes.OfferNew, title(offer), `${offer.dealer.name} offers ${rand(offer.amount)} for your ${this.vehicleName(request)}. Valid until ${offer.expiresAt.toISOString()}.`, {
          offerId: offer.id,
          sellRequestId: request.id,
          name,
        });
      };
    this.outbox.on(OutboxEvents.OfferSubmitted, 'bidding.offer-submitted', offerToCustomer('submitted', () => 'You received a new offer'));
    this.outbox.on(OutboxEvents.OfferUpdated, 'bidding.offer-updated', offerToCustomer('updated', (offer) => `${offer.dealer.name} updated their offer`));

    this.outbox.on(OutboxEvents.OfferWithdrawn, 'bidding.offer-withdrawn', async (event) => {
      const offer = await this.loadOffer(event.payload.offerId);
      if (!offer) return;
      await this.toCustomer(offer.session.sellRequest, NotificationTypes.OfferWithdrawn, 'An offer was withdrawn', `${offer.dealer.name} withdrew their offer for your ${this.vehicleName(offer.session.sellRequest)}.`, { offerId: offer.id });
    });

    this.outbox.on(OutboxEvents.OfferCountered, 'bidding.offer-countered', async (event) => {
      const [offer, counter] = await Promise.all([this.loadOffer(event.payload.offerId), this.prisma.counterOffer.findUnique({ where: { id: event.payload.counterOfferId } })]);
      if (!offer || !counter) return;
      await this.toDealer(offer.dealerId, NotificationTypes.OfferCountered, 'Customer sent a counter-offer', `The customer countered your ${rand(offer.amount)} offer on the ${this.vehicleName(offer.session.sellRequest)} with ${rand(counter.amount)}.`, { offerId: offer.id });
    });

    this.outbox.on(OutboxEvents.CounterOfferResponded, 'bidding.counter-responded', async (event) => {
      const offer = await this.loadOffer(event.payload.offerId);
      if (!offer) return;
      const body = event.payload.accepted
        ? `${offer.dealer.name} accepted your counter-offer. Their offer is now ${rand(offer.amount)}; accept it to proceed.`
        : `${offer.dealer.name} declined your counter-offer. Their offer of ${rand(offer.amount)} still stands.`;
      await this.toCustomer(offer.session.sellRequest, NotificationTypes.OfferCounterResponse, 'Dealer responded to your counter-offer', body, { offerId: offer.id });
    });

    this.outbox.on(OutboxEvents.OfferRejected, 'bidding.offer-rejected', async (event) => {
      const offer = await this.loadOffer(event.payload.offerId);
      if (!offer) return;
      await this.toDealer(offer.dealerId, NotificationTypes.OfferRejected, 'Offer rejected', `Your ${rand(offer.amount)} offer on the ${this.vehicleName(offer.session.sellRequest)} was rejected.`, { offerId: offer.id });
    });

    this.outbox.on(OutboxEvents.OfferAccepted, 'bidding.offer-accepted', async (event) => {
      const offer = await this.loadOffer(event.payload.offerId);
      if (!offer) return;
      const request = offer.session.sellRequest;
      await this.toCustomer(request, NotificationTypes.OfferAccepted, 'Offer accepted', `You accepted ${offer.dealer.name}'s offer of ${rand(offer.amount)} for your ${this.vehicleName(request)}. The dealer will contact you to arrange inspection and payment.`, { offerId: offer.id, dealId: event.payload.dealId });
      await this.toDealer(offer.dealerId, NotificationTypes.OfferAccepted, 'Your offer was accepted', `The customer accepted your ${rand(offer.amount)} offer for the ${this.vehicleName(request)} (${request.reference}). A lead has been added to your CRM.`, { offerId: offer.id, dealId: event.payload.dealId });
      const superseded = await this.prisma.offer.findMany({ where: { id: { in: event.payload.supersededOfferIds ?? [] } }, select: { id: true, dealerId: true } });
      for (const other of superseded) {
        await this.toDealer(other.dealerId, NotificationTypes.OfferRejected, 'Another offer was accepted', `The customer accepted a different offer for the ${this.vehicleName(request)}.`, { offerId: other.id });
      }
    });

    this.outbox.on(OutboxEvents.OfferExpired, 'bidding.offer-expired', async (event) => {
      const offer = await this.loadOffer(event.payload.offerId);
      if (!offer) return;
      const request = offer.session.sellRequest;
      await this.toDealer(offer.dealerId, NotificationTypes.OfferExpired, 'Offer expired', `Your offer on the ${this.vehicleName(request)} expired. You can renew it while bidding is open.`, { offerId: offer.id });
      await this.toCustomer(request, NotificationTypes.OfferExpired, 'An offer expired', `${offer.dealer.name}'s offer of ${rand(offer.amount)} has expired.`, { offerId: offer.id });
    });
  }
}

/** Bidding clock (worker only). Each job is a conditional, idempotent update, safe on many workers. */
@Injectable()
class BiddingJobs {
  private readonly logger = new Logger(BiddingJobs.name);
  constructor(private readonly bidding: BiddingService) {}

  @Interval('bidding-clock', 30_000)
  async tick(): Promise<void> {
    try {
      await this.bidding.openScheduledSessions();
      await this.bidding.closeEndedSessions();
      await this.bidding.expireOffers();
    } catch (error) {
      this.logger.error(`Bidding clock failed: ${(error as Error).message}`);
    }
  }
}

@Module({
  imports: [CrmModule],
  controllers: [AdminBiddingController, DealerBiddingController, MyOffersController],
  providers: [BiddingService, BiddingNotifications, BiddingJobs],
  exports: [BiddingService],
})
export class BiddingModule {}
