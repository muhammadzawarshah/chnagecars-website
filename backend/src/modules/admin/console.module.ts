import { Body, Controller, Get, Injectable, Module, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CurrentUser, Roles } from '../../common/decorators/auth.decorators';
import type { AuthUser } from '../../common/types/auth-user';
import { Errors } from '../../common/errors/app-error';
import { PaginationQueryDto, pageArgs, toPage } from '../../common/dto/pagination.dto';
import { DealerMemberRole, DealerPermission, Prisma, UserRole } from '../../generated/prisma/client';
import { DealerContext } from '../dealers/dealer-access';
import { CrmModule } from '../crm/crm.module';
import { LeadsService } from '../crm/leads.service';
import { AssignLeadDto, ChangeStageDto } from '../crm/dto/lead.dto';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { CacheNs, CacheService } from '../../infrastructure/cache/cache.service';
import { AppConfig } from '../../config/app-config.service';
import { FilterSnapshotsService } from '../search/filter-snapshots';
import { SearchModule } from '../search/search.service';

class ConsoleLeadQuery extends PaginationQueryDto {
  @IsOptional() @IsUUID() dealerId?: string;
  @IsOptional() @IsString() @MaxLength(100) q?: string;
}

@Injectable()
export class ConsoleService {
  constructor(private readonly db: PrismaService, private readonly config: AppConfig,
    private readonly snapshots: FilterSnapshotsService, private readonly cache: CacheService,
    private readonly audit: AuditService, private readonly crm: LeadsService) {}

  private async leadContext(actor: AuthUser, id: string): Promise<DealerContext> {
    const lead = await this.db.lead.findUnique({ where: { id }, select: { dealerId: true, dealer: { select: { status: true } } } });
    if (!lead) throw Errors.notFound('Lead');
    // A platform-admin scope, not a login as dealer staff. Activity and audit actor stay the real user.
    return { userId: actor.id, memberId: actor.id, dealerId: lead.dealerId, dealerStatus: lead.dealer.status,
      role: DealerMemberRole.OWNER, branchId: null, wideScope: true,
      permissions: [DealerPermission.LEADS_VIEW_ALL, DealerPermission.LEADS_MANAGE_ALL, DealerPermission.LEADS_ASSIGN] };
  }

  async lead(actor: AuthUser, id: string) {
    const ctx = await this.leadContext(actor, id);
    const [lead, members] = await Promise.all([this.crm.get(ctx, id), this.db.dealerMember.findMany({
      where: { dealerId: ctx.dealerId, status: 'ACTIVE', user: { status: 'ACTIVE' } },
      select: { id: true, user: { select: { firstName: true, lastName: true } } },
    })]);
    return { ...lead, members };
  }
  async assignLead(actor: AuthUser, id: string, dto: AssignLeadDto) { return this.crm.assign(await this.leadContext(actor, id), id, dto); }
  async stageLead(actor: AuthUser, id: string, dto: ChangeStageDto) { return this.crm.changeStage(await this.leadContext(actor, id), id, dto); }

  async quality() {
    const [counts, colours, duplicates, samples] = await Promise.all([
      this.db.$queryRaw<Array<{ total: bigint; missingCoordinates: bigint; missingImages: bigint; missingColour: bigint; invalidPrice: bigint }>>(Prisma.sql`
        SELECT count(*) AS total,
        count(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) AS "missingCoordinates",
        count(*) FILTER (WHERE "primaryImageUrl" IS NULL OR "primaryImageUrl" = '') AS "missingImages",
        count(*) FILTER (WHERE colour IS NULL OR trim(colour) = '') AS "missingColour",
        count(*) FILTER (WHERE price <= 0) AS "invalidPrice"
        FROM vehicles WHERE status <> 'ARCHIVED'`),
      this.db.vehicle.groupBy({ by: ['colour'], where: { status: { not: 'ARCHIVED' } }, _count: { _all: true }, orderBy: { colour: 'asc' } }),
      this.db.$queryRaw<Array<{ dealerId: string; stockNumber: string; count: bigint }>>(Prisma.sql`
        SELECT "dealerId", "stockNumber", count(*) AS count FROM vehicles
        WHERE status <> 'ARCHIVED' AND "stockNumber" IS NOT NULL AND trim("stockNumber") <> ''
        GROUP BY "dealerId", "stockNumber" HAVING count(*) > 1 ORDER BY count(*) DESC LIMIT 50`),
      this.db.vehicle.findMany({ where: { status: { not: 'ARCHIVED' }, OR: [{ latitude: null }, { longitude: null }, { primaryImageUrl: null }, { primaryImageUrl: '' }, { colour: null }, { colour: '' }, { price: { lte: 0 } }] },
        select: { id: true, title: true, colour: true, latitude: true, longitude: true, price: true, primaryImageUrl: true, dealer: { select: { name: true } } },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], take: 50 }),
    ]);
    return { counts: Object.fromEntries(Object.entries(counts[0]).map(([k, v]) => [k, Number(v)])),
      colours: colours.map(row => ({ name: row.colour, cars: row._count._all })),
      duplicateStockNumbers: duplicates.map(row => ({ ...row, count: Number(row.count) })), samples };
  }

  async leads(query: ConsoleLeadQuery) {
    const { page, pageSize, skip, take } = pageArgs(query);
    const where: Prisma.LeadWhereInput = { ...(query.dealerId ? { dealerId: query.dealerId } : {}),
      ...(query.q ? { OR: [{ name: { contains: query.q, mode: 'insensitive' } }, { email: { contains: query.q, mode: 'insensitive' } }] } : {}) };
    const [data, total] = await Promise.all([
      this.db.lead.findMany({ where, select: { id: true, name: true, phone: true, email: true, source: true, stage: true, createdAt: true, firstResponseAt: true,
        dealer: { select: { id: true, name: true } }, vehicle: { select: { id: true, title: true } }, assignedTo: { select: { id: true, user: { select: { firstName: true, lastName: true } } } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip, take }), this.db.lead.count({ where }),
    ]);
    return toPage(data, total, page, pageSize);
  }

  async imports() {
    const where: Prisma.VehicleWhereInput = { sourceData: { not: Prisma.DbNull } };
    const [total, latest, images] = await Promise.all([
      this.db.vehicle.count({ where }),
      this.db.vehicle.findMany({ where, select: { id: true, title: true, status: true, createdAt: true, updatedAt: true, dealer: { select: { name: true } } }, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], take: 30 }),
      this.db.vehicleImage.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    return { total, latest, images: Object.fromEntries(images.map(x => [x.status, x._count._all])),
      note: 'Import run history is not recorded. Updated time is the vehicle update time, not the last feed sync.' };
  }

  async snapshotHistory() {
    return this.db.vehicleFilterSnapshot.findMany({ select: { revision: true, total: true, sha256: true, compressedBytes: true, generatedAt: true }, orderBy: { generatedAt: 'desc' }, take: 10 });
  }

  async refreshSnapshot() {
    await this.cache.bump(CacheNs.vehicles);
    const result = await this.snapshots.manifest();
    await this.audit.record({ action: 'admin.snapshot_refresh', entityType: 'vehicle_filter_snapshot', entityId: result.revision });
    return result;
  }

  settings() {
    // Explicit allowlist: no credentials or provider connection strings are returned.
    return { apiPrefix: this.config.get('API_PREFIX'), maxImagesPerVehicle: this.config.get('MEDIA_MAX_IMAGES_PER_VEHICLE'),
      reservationHoldHours: this.config.get('RESERVATION_HOLD_HOURS'), biddingMaxDurationHours: this.config.get('BIDDING_MAX_DURATION_HOURS'),
      workerInApi: this.config.get('RUN_WORKER_IN_API'), mode: 'Deployment-managed settings; read-only in the console.' };
  }

  async viewDealer(id: string) {
    const dealer = await this.db.dealer.findUnique({ where: { id }, select: { id: true } });
    if (!dealer) throw Errors.notFound('Dealer');
    await this.audit.record({ action: 'admin.dealer_view', entityType: 'dealer', entityId: id });
    return { ok: true };
  }
}

@ApiTags('Super admin console')
@ApiBearerAuth()
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin/console')
export class ConsoleController {
  constructor(private readonly service: ConsoleService) {}
  @Get('quality') quality() { return this.service.quality(); }
  @Get('leads') leads(@Query() query: ConsoleLeadQuery) { return this.service.leads(query); }
  @Get('leads/:id') lead(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.lead(user, id); }
  @Post('leads/:id/assign') assign(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignLeadDto) { return this.service.assignLead(user, id, dto); }
  @Post('leads/:id/stage') stage(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangeStageDto) { return this.service.stageLead(user, id, dto); }
  @Get('imports') imports() { return this.service.imports(); }
  @Get('snapshots') snapshots() { return this.service.snapshotHistory(); }
  @Post('snapshots/refresh') refresh() { return this.service.refreshSnapshot(); }
  @Get('settings') settings() { return this.service.settings(); }
  @Post('dealers/:id/view') view(@Param('id', ParseUUIDPipe) id: string) { return this.service.viewDealer(id); }
}

@Module({ imports: [SearchModule, CrmModule], controllers: [ConsoleController], providers: [ConsoleService] })
export class ConsoleModule {}
