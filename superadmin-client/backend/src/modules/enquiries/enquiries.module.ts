import { Body, Controller, Get, Injectable, Module, OnModuleInit, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DealerPermission, EnquiryType, UserRole } from '../../generated/prisma/client';
import { CurrentUser, OptionalAuth, Roles } from '../../common/decorators/auth.decorators';
import type { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { CrmModule } from '../crm/crm.module';
import { CurrentDealer, DealerAccess, DealerContext } from '../dealers/dealer-access';
import { NotificationTypes } from '../notifications/notification-types';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AdminEnquiryQueryDto,
  AdminUpdateEnquiryDto,
  BeatMyQuoteDto,
  ConciergeDto,
  ContactDto,
  CustomerReplyDto,
  EnquiryQueryDto,
  FinanceEnquiryDto,
  GeneralContactDto,
  HelpMeFindDto,
  InsuranceEnquiryDto,
  QuoteRequestDto,
  RespondDto,
  TestDriveDto,
  TradeInDto,
  VehicleEnquiryDto,
} from './dto/enquiry.dto';
import { EnquiriesService } from './enquiries.service';

/** Anti-spam limit for public forms (brief section 11). */
const FORM_LIMIT = { default: { limit: 10, ttl: 60_000 } };

const contactOf = (dto: ContactDto): ContactDto => ({ name: dto.name, email: dto.email, phone: dto.phone, consent: dto.consent });

@ApiTags('Enquiries (public forms)')
@OptionalAuth()
@Throttle(FORM_LIMIT)
@Controller('enquiries')
export class PublicEnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Post('vehicle')
  @ApiOperation({ summary: 'Contact the dealer about a vehicle (FR-14). Opens a lead for the dealer.' })
  vehicle(@Body() dto: VehicleEnquiryDto, @CurrentUser() user?: AuthUser) {
    return this.enquiries.submit(
      {
        type: EnquiryType.VEHICLE,
        contact: contactOf(dto),
        message: dto.message,
        vehicleId: dto.vehicleId,
        details: { interestedInFinance: dto.interestedInFinance ?? false, hasTradeIn: dto.hasTradeIn ?? false },
      },
      user,
    );
  }

  @Post('test-drive')
  @ApiOperation({ summary: 'Book a test drive for a listed vehicle' })
  testDrive(@Body() dto: TestDriveDto, @CurrentUser() user?: AuthUser) {
    return this.enquiries.submit(
      { type: EnquiryType.TEST_DRIVE, contact: contactOf(dto), message: dto.message, vehicleId: dto.vehicleId, details: { preferredAt: dto.preferredAt } },
      user,
    );
  }

  @Post('quote')
  @ApiOperation({ summary: 'Request a quotation for a vehicle (FR-06, FR-15)' })
  quote(@Body() dto: QuoteRequestDto, @CurrentUser() user?: AuthUser) {
    return this.enquiries.submit(
      {
        type: EnquiryType.QUOTE,
        contact: contactOf(dto),
        message: dto.requirements,
        dealerId: dto.dealerId,
        makeId: dto.makeId,
        modelId: dto.modelId,
        variantId: dto.variantId,
        details: { province: dto.province, requirements: dto.requirements ?? null },
      },
      user,
    );
  }

  @Post('beat-my-quote')
  @ApiOperation({ summary: 'Beat My Quote: submit an existing quote for a better offer (FR-16)' })
  beatMyQuote(@Body() dto: BeatMyQuoteDto, @CurrentUser() user?: AuthUser) {
    return this.enquiries.submit(
      {
        type: EnquiryType.BEAT_MY_QUOTE,
        contact: contactOf(dto),
        message: dto.quoteDetails,
        makeId: dto.makeId,
        modelId: dto.modelId,
        variantId: dto.variantId,
        details: { desiredVehicle: dto.desiredVehicle, quotedPrice: dto.quotedPrice, quotingDealer: dto.quotingDealer, province: dto.province },
      },
      user,
    );
  }

  @Post('trade-in')
  @ApiOperation({ summary: 'Trade in a vehicle when buying another (FR-20)' })
  tradeIn(@Body() dto: TradeInDto, @CurrentUser() user?: AuthUser) {
    return this.enquiries.submit(
      {
        type: EnquiryType.TRADE_IN,
        contact: contactOf(dto),
        message: dto.message,
        vehicleId: dto.vehicleId,
        details: { tradeIn: { ...dto.tradeIn }, desiredVehicle: dto.desiredVehicle ?? null },
      },
      user,
    );
  }

  @Post('concierge')
  @ApiOperation({ summary: 'Request concierge services (FR-21)' })
  concierge(@Body() dto: ConciergeDto, @CurrentUser() user?: AuthUser) {
    return this.enquiries.submit(
      { type: EnquiryType.CONCIERGE, contact: contactOf(dto), message: dto.notes, details: { services: dto.services, budget: dto.budget ?? null, province: dto.province ?? null } },
      user,
    );
  }

  @Post('help-me-find')
  @ApiOperation({ summary: 'Ask the team to find a vehicle (FR-22)' })
  helpMeFind(@Body() dto: HelpMeFindDto, @CurrentUser() user?: AuthUser) {
    return this.enquiries.submit(
      {
        type: EnquiryType.HELP_ME_FIND,
        contact: contactOf(dto),
        message: dto.preferences,
        makeId: dto.makeId,
        modelId: dto.modelId,
        details: {
          vehicleType: dto.vehicleType ?? null,
          budgetMin: dto.budgetMin ?? null,
          budgetMax: dto.budgetMax,
          minYear: dto.minYear ?? null,
          maxMileage: dto.maxMileage ?? null,
          province: dto.province ?? null,
        },
      },
      user,
    );
  }

  @Post('finance')
  @ApiOperation({ summary: 'Finance application interest (FR-33 finance enquiries)' })
  finance(@Body() dto: FinanceEnquiryDto, @CurrentUser() user?: AuthUser) {
    return this.enquiries.submit(
      {
        type: EnquiryType.FINANCE,
        contact: contactOf(dto),
        message: dto.message,
        vehicleId: dto.vehicleId,
        details: {
          vehiclePrice: dto.vehiclePrice ?? null,
          deposit: dto.deposit ?? null,
          termMonths: dto.termMonths ?? null,
          monthlyIncome: dto.monthlyIncome ?? null,
          employmentStatus: dto.employmentStatus ?? null,
        },
      },
      user,
    );
  }

  @Post('insurance')
  @ApiOperation({ summary: 'Insurance quote request (FR-30)' })
  insurance(@Body() dto: InsuranceEnquiryDto, @CurrentUser() user?: AuthUser) {
    return this.enquiries.submit(
      {
        type: EnquiryType.INSURANCE,
        contact: contactOf(dto),
        message: dto.message,
        // Insurance is handled by the platform team, never routed to the selling dealer.
        details: { vehicleId: dto.vehicleId ?? null, vehicleDescription: dto.vehicleDescription ?? null, coverType: dto.coverType ?? null, province: dto.province ?? null },
      },
      user,
    );
  }

  @Post('contact')
  @ApiOperation({ summary: 'General "contact us" message' })
  contact(@Body() dto: GeneralContactDto, @CurrentUser() user?: AuthUser) {
    return this.enquiries.submit({ type: EnquiryType.GENERAL, contact: contactOf(dto), message: dto.message, details: { subject: dto.subject } }, user);
  }
}

@ApiTags('Customer: enquiries')
@ApiBearerAuth()
@Controller('me/enquiries')
export class MyEnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Get()
  @ApiOperation({ summary: 'My enquiries with status, dealer response and follow-up (FR-42)' })
  list(@CurrentUser() user: AuthUser, @Query() query: EnquiryQueryDto) {
    return this.enquiries.listMine(user.id, query);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.enquiries.getMine(user.id, id);
  }

  @Post(':id/reply')
  reply(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CustomerReplyDto) {
    return this.enquiries.customerReply(user.id, id, dto.message);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.enquiries.cancelMine(user.id, id);
  }
}

@ApiTags('Dealer portal: enquiries')
@ApiBearerAuth()
@Controller('dealer/enquiries')
export class DealerEnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Get()
  @DealerAccess({ permissions: [DealerPermission.ENQUIRIES_VIEW] })
  list(@CurrentDealer() dealer: DealerContext, @Query() query: EnquiryQueryDto) {
    return this.enquiries.listForDealer(dealer, query);
  }

  @Get(':id')
  @DealerAccess({ permissions: [DealerPermission.ENQUIRIES_VIEW] })
  get(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.enquiries.getForDealer(dealer, id);
  }

  @Post(':id/respond')
  @DealerAccess({ permissions: [DealerPermission.ENQUIRIES_RESPOND] })
  @ApiOperation({ summary: 'Reply to the customer; also moves the lead from NEW to CONTACTED' })
  respond(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RespondDto) {
    return this.enquiries.respondAsDealer(dealer, id, dto);
  }
}

@ApiTags('Admin: enquiries')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/enquiries')
export class AdminEnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Get()
  list(@Query() query: AdminEnquiryQueryDto) {
    return this.enquiries.listForAdmin(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.enquiries.getForAdmin(id);
  }

  @Post(':id/respond')
  respond(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RespondDto, @CurrentUser() admin: AuthUser) {
    return this.enquiries.respondAsAdmin(id, dto, admin.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Change status, assign a team member or route the request to a dealer' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdminUpdateEnquiryDto) {
    return this.enquiries.adminUpdate(id, dto);
  }
}

const TYPE_LABEL: Record<EnquiryType, string> = {
  VEHICLE: 'vehicle enquiry',
  QUOTE: 'quote request',
  BEAT_MY_QUOTE: 'Beat My Quote request',
  TRADE_IN: 'trade-in request',
  CONCIERGE: 'concierge request',
  HELP_ME_FIND: 'vehicle-finding request',
  FINANCE: 'finance enquiry',
  INSURANCE: 'insurance request',
  TEST_DRIVE: 'test drive request',
  GENERAL: 'message',
};

@Injectable()
class EnquiryNotifications implements OnModuleInit {
  constructor(
    private readonly outbox: OutboxService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    this.outbox.on(OutboxEvents.EnquiryCreated, 'enquiries.notify-handlers', async (event) => {
      const enquiry = await this.prisma.enquiry.findUnique({ where: { id: event.payload.enquiryId }, include: { vehicle: { select: { title: true } } } });
      if (!enquiry) return;
      const label = TYPE_LABEL[enquiry.type];
      const about = enquiry.vehicle ? ` about ${enquiry.vehicle.title}` : '';
      const recipients = enquiry.dealerId
        ? await this.notifications.dealerRecipients(enquiry.dealerId, DealerPermission.ENQUIRIES_VIEW, enquiry.branchId)
        : await this.notifications.adminRecipients();
      await this.notifications.notify({
        userIds: recipients,
        type: NotificationTypes.EnquiryNew,
        title: `New ${label}`,
        body: `${enquiry.name} sent a ${label}${about} (${enquiry.reference}).`,
        data: { enquiryId: enquiry.id, reference: enquiry.reference, type: enquiry.type },
      });
      if (!event.payload.routed) {
        await this.notifications.emailGuest(
          enquiry.email,
          `We received your ${label} (${enquiry.reference})`,
          `Hi ${enquiry.name},\n\nThanks for your ${label}${about}. Your reference is ${enquiry.reference}. ${enquiry.dealerId ? 'The dealer' : 'Our team'} will be in touch shortly.\n`,
        );
      }
    });

    this.outbox.on(OutboxEvents.EnquiryResponded, 'enquiries.notify-customer', async (event) => {
      const [enquiry, response] = await Promise.all([
        this.prisma.enquiry.findUnique({ where: { id: event.payload.enquiryId }, include: { dealer: { select: { name: true } } } }),
        this.prisma.enquiryResponse.findUnique({ where: { id: event.payload.responseId } }),
      ]);
      if (!enquiry || !response) return;
      const from = enquiry.dealer?.name ?? 'ChangeCars';
      const title = `${from} replied to your ${TYPE_LABEL[enquiry.type]}`;
      const body = `${response.message}\n\nReference: ${enquiry.reference}`;
      if (enquiry.customerId) {
        await this.notifications.notify({ userIds: [enquiry.customerId], type: NotificationTypes.EnquiryResponse, title, body, data: { enquiryId: enquiry.id } });
      } else {
        await this.notifications.emailGuest(enquiry.email, title, `Hi ${enquiry.name},\n\n${body}\n`);
      }
    });
  }
}

@Module({
  imports: [CrmModule],
  controllers: [PublicEnquiriesController, MyEnquiriesController, DealerEnquiriesController, AdminEnquiriesController],
  providers: [EnquiriesService, EnquiryNotifications],
  exports: [EnquiriesService],
})
export class EnquiriesModule {}
