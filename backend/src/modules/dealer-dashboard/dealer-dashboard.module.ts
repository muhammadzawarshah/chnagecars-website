import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BiddingStatus, EnquiryStatus, OfferStatus, Prisma, VehicleStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CrmModule } from '../crm/crm.module';
import { LeadsService } from '../crm/leads.service';
import { CurrentDealer, DealerAccess, DealerAccessService, DealerContext } from '../dealers/dealer-access';

/** FR-13 dealer dashboard: inventory, enquiries, leads and offers in one call. */
@Injectable()
export class DealerDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leads: LeadsService,
  ) {}

  async summary(ctx: DealerContext) {
    const scope: Prisma.VehicleWhereInput = { dealerId: ctx.dealerId, ...DealerAccessService.branchScope(ctx) };
    const since30 = new Date(Date.now() - 30 * 86_400_000);
    const [dealer, byStatus, stock, soldLast30, openEnquiries, activeOffers, openSessions, topViewed, leadStats] = await Promise.all([
      this.prisma.dealer.findUniqueOrThrow({ where: { id: ctx.dealerId }, select: { id: true, name: true, status: true, plan: true, biddingEnabled: true } }),
      this.prisma.vehicle.groupBy({ by: ['status'], where: scope, _count: { _all: true } }),
      this.prisma.vehicle.aggregate({ where: { ...scope, status: VehicleStatus.PUBLISHED }, _sum: { price: true, viewCount: true, enquiryCount: true } }),
      this.prisma.vehicle.findMany({ where: { ...scope, status: VehicleStatus.SOLD, soldAt: { gte: since30 } }, select: { publishedAt: true, soldAt: true } }),
      this.prisma.enquiry.count({ where: { dealerId: ctx.dealerId, ...DealerAccessService.branchScope(ctx), status: { in: [EnquiryStatus.NEW, EnquiryStatus.IN_PROGRESS] } } }),
      this.prisma.offer.count({ where: { dealerId: ctx.dealerId, status: { in: [OfferStatus.SUBMITTED, OfferStatus.UPDATED, OfferStatus.PENDING] } } }),
      this.prisma.biddingSession.count({ where: { status: BiddingStatus.OPEN } }),
      this.prisma.vehicle.findMany({
        where: { ...scope, status: { in: [VehicleStatus.PUBLISHED, VehicleStatus.RESERVED] } },
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: { id: true, title: true, slug: true, price: true, viewCount: true, enquiryCount: true, favouriteCount: true, primaryImageUrl: true },
      }),
      ctx.permissions.some((p) => p.startsWith('LEADS_')) ? this.leads.stats(ctx) : Promise.resolve(null),
    ]);
    const daysToSell = soldLast30
      .filter((row) => row.publishedAt && row.soldAt)
      .map((row) => (row.soldAt!.getTime() - row.publishedAt!.getTime()) / 86_400_000);
    return {
      dealer,
      inventory: {
        byStatus: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
        publishedStockValue: stock._sum.price ?? 0,
        totalViews: stock._sum.viewCount ?? 0,
        totalEnquiries: stock._sum.enquiryCount ?? 0,
        soldLast30Days: soldLast30.length,
        averageDaysToSell: daysToSell.length ? Math.round(daysToSell.reduce((a, b) => a + b, 0) / daysToSell.length) : null,
        topViewed,
      },
      enquiries: { open: openEnquiries },
      offers: { active: activeOffers, openBiddingSessions: dealer.biddingEnabled ? openSessions : 0 },
      leads: leadStats,
    };
  }
}

@ApiTags('Dealer portal: dashboard')
@ApiBearerAuth()
@Controller('dealer/dashboard')
export class DealerDashboardController {
  constructor(private readonly dashboard: DealerDashboardService) {}

  @Get()
  @DealerAccess({ allowInactive: true })
  @ApiOperation({ summary: 'Dealer dashboard summary (FR-13)' })
  summary(@CurrentDealer() dealer: DealerContext) {
    return this.dashboard.summary(dealer);
  }
}

@Module({
  imports: [CrmModule],
  controllers: [DealerDashboardController],
  providers: [DealerDashboardService],
})
export class DealerDashboardModule {}
