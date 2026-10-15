import { Body, Controller, Get, Injectable, Module, OnModuleInit, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DealerPermission } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxEvents } from '../../infrastructure/outbox/outbox.events';
import { OutboxService } from '../../infrastructure/outbox/outbox.service';
import { CurrentDealer, DealerAccess, DealerContext } from '../dealers/dealer-access';
import { NotificationTypes } from '../notifications/notification-types';
import { NotificationsService } from '../notifications/notifications.service';
import { AddActivityDto, AssignLeadDto, ChangeStageDto, CreateLeadDto, LeadQueryDto, UpdateLeadDto } from './dto/lead.dto';
import { LeadsService } from './leads.service';

const VIEW = [DealerPermission.LEADS_VIEW_ALL, DealerPermission.LEADS_MANAGE_ALL, DealerPermission.LEADS_MANAGE_ASSIGNED];
const MANAGE = [DealerPermission.LEADS_MANAGE_ALL, DealerPermission.LEADS_MANAGE_ASSIGNED];

@ApiTags('Dealer portal: CRM')
@ApiBearerAuth()
@Controller('dealer/leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  @DealerAccess({ anyPermission: VIEW })
  @ApiOperation({ summary: 'Leads visible to me: all (LEADS_VIEW_ALL) or only assigned to me' })
  list(@CurrentDealer() dealer: DealerContext, @Query() query: LeadQueryDto) {
    return this.leads.list(dealer, query);
  }

  @Get('stats')
  @DealerAccess({ anyPermission: VIEW })
  @ApiOperation({ summary: 'Pipeline counts, conversion rate, average first response time, overdue follow-ups' })
  stats(@CurrentDealer() dealer: DealerContext) {
    return this.leads.stats(dealer);
  }

  @Post()
  @DealerAccess({ anyPermission: MANAGE })
  @ApiOperation({ summary: 'Create a lead manually (walk-in, phone, WhatsApp...)' })
  create(@CurrentDealer() dealer: DealerContext, @Body() dto: CreateLeadDto) {
    return this.leads.create(dealer, dto);
  }

  @Get(':id')
  @DealerAccess({ anyPermission: VIEW })
  get(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.leads.get(dealer, id);
  }

  @Patch(':id')
  @DealerAccess({ anyPermission: MANAGE })
  update(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLeadDto) {
    return this.leads.update(dealer, id, dto);
  }

  @Post(':id/stage')
  @DealerAccess({ anyPermission: MANAGE })
  @ApiOperation({ summary: 'Move through New → Contacted → Qualified → Negotiation → Offer Sent → Won/Lost (FR-44)' })
  changeStage(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangeStageDto) {
    return this.leads.changeStage(dealer, id, dto);
  }

  @Post(':id/assign')
  @DealerAccess({ permissions: [DealerPermission.LEADS_ASSIGN] })
  assign(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignLeadDto) {
    return this.leads.assign(dealer, id, dto);
  }

  @Post(':id/activities')
  @DealerAccess({ anyPermission: MANAGE })
  @ApiOperation({ summary: 'Log a call, email, WhatsApp, meeting or note and schedule the next follow-up' })
  addActivity(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AddActivityDto) {
    return this.leads.addActivity(dealer, id, dto);
  }
}

@Injectable()
class LeadNotifications implements OnModuleInit {
  constructor(
    private readonly outbox: OutboxService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    this.outbox.on(OutboxEvents.LeadAssigned, 'crm.lead-assigned', async (event) => {
      const [member, lead] = await Promise.all([
        this.prisma.dealerMember.findUnique({ where: { id: event.payload.memberId }, select: { userId: true } }),
        this.prisma.lead.findUnique({ where: { id: event.payload.leadId }, select: { id: true, name: true, assignedToId: true } }),
      ]);
      if (!member || !lead || lead.assignedToId !== event.payload.memberId) return;
      await this.notifications.notify({
        userIds: [member.userId],
        type: NotificationTypes.LeadAssigned,
        title: 'New lead assigned to you',
        body: `${lead.name} has been assigned to you.`,
        data: { leadId: lead.id },
      });
    });
  }
}

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, LeadNotifications],
  exports: [LeadsService],
})
export class CrmModule {}
