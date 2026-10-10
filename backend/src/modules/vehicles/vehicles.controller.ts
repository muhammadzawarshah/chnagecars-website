import { PublicCache } from '../../common/interceptors/cache-headers.interceptor';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DealerPermission, UserRole, VehicleStatus } from '../../generated/prisma/client';
import { CurrentUser, OptionalAuth, Public, Roles } from '../../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/types/auth-user';
import { CurrentDealer, DealerAccess, DealerContext } from '../dealers/dealer-access';
import { SearchCriteriaDto, SearchVehiclesQueryDto } from '../search/dto/search.dto';
import { SearchService } from '../search/search.service';
import {
  AdminFlagsDto,
  AdminVehicleQueryDto,
  CompareVehiclesQueryDto,
  CreateVehicleDto,
  DealerVehicleQueryDto,
  ImageUploadRequestDto,
  RelatedQueryDto,
  ReorderImagesDto,
  ReserveDto,
  TransitionDto,
  UpdateImageDto,
  UpdateVehicleDto,
} from './dto/vehicle.dto';
import { PublicVehiclesService } from './public-vehicles.service';
import { VehicleImagesService } from './vehicle-images.service';
import { VehiclesService } from './vehicles.service';

@ApiTags('Vehicles (public)')
@Controller('vehicles')
@PublicCache(60)
export class PublicVehiclesController {
  constructor(
    private readonly search: SearchService,
    private readonly vehicles: PublicVehiclesService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search, filter and sort listed vehicles (FR-02, FR-03, FR-05, FR-06, FR-07, FR-27)' })
  searchVehicles(@Query() query: SearchVehiclesQueryDto) {
    return this.search.search(query);
  }

  @Public()
  @Get('facets')
  @ApiOperation({ summary: 'Counts per make, fuel, transmission, province, condition and category for a search' })
  facets(@Query() query: SearchCriteriaDto) {
    return this.search.facets(query);
  }

  @Public()
  @Get('filters/all')
  @ApiOperation({ summary: 'Complete filter options and unpaginated public vehicle filter snapshot for app-side filtering' })
  allFilterData() {
    return this.search.allFilterData();
  }

  @Public()
  @Get('filters/colours')
  @ApiOperation({ summary: 'colours options and counts for active search filters' })
  async filterColour(@Query() query: SearchCriteriaDto) {
    const facets = await this.search.facets(query);
    return { total: facets.total, options: facets.colour };
  }

  @Public()
  @Get('filters/makes')
  @ApiOperation({ summary: 'makes options and counts for active search filters' })
  async filterMakes(@Query() query: SearchCriteriaDto) {
    const facets = await this.search.facets(query);
    return { total: facets.total, options: facets.makes };
  }

  @Public()
  @Get('filters/models')
  @ApiOperation({ summary: 'models options and counts for active search filters' })
  async filterModels(@Query() query: SearchCriteriaDto) {
    const facets = await this.search.facets(query);
    return { total: facets.total, options: facets.models };
  }

  @Public()
  @Get('filters/variants')
  @ApiOperation({ summary: 'variants options and counts for active search filters' })
  async filterVariants(@Query() query: SearchCriteriaDto) {
    const facets = await this.search.facets(query);
    return { total: facets.total, options: facets.variants };
  }

  @Public()
  @Get('filters/transmissions')
  @ApiOperation({ summary: 'transmissions options and counts for active search filters' })
  async filterTransmission(@Query() query: SearchCriteriaDto) {
    const facets = await this.search.facets(query);
    return { total: facets.total, options: ['AUTOMATIC', 'MANUAL', 'UNKNOWN'].map((value) => ({ value, count: facets.transmission.find((option) => option.value === value)?.count ?? 0 })) };
  }

  @Public()
  @Get('filters/fuel-types')
  @ApiOperation({ summary: 'fuel-types options and counts for active search filters' })
  async filterFueltype(@Query() query: SearchCriteriaDto) {
    const facets = await this.search.facets(query);
    return { total: facets.total, options: ['PETROL', 'DIESEL', 'HYBRID', 'PLUGIN_HYBRID', 'ELECTRIC', 'LPG', 'OTHER'].map((value) => ({ value, count: facets.fuelType.find((option) => option.value === value)?.count ?? 0 })) };
  }

  @Public()
  @Get('filters/drives')
  @ApiOperation({ summary: 'drives options and counts for active search filters' })
  async filterDrivetrain(@Query() query: SearchCriteriaDto) {
    const facets = await this.search.facets(query);
    return { total: facets.total, options: ['FOUR_X_FOUR', 'FOUR_X_TWO', 'AWD', 'FWD', 'RWD'].map((value) => ({ value, count: facets.drivetrain.find((option) => option.value === value)?.count ?? 0 })) };
  }

  @Public()
  @Get('count')
  @ApiOperation({ summary: 'Count listed vehicles matching filter criteria (GET query params)' })
  count(@Query() query: SearchCriteriaDto) {
    return this.search.count(query);
  }

  @Public()
  @Post('count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Count listed vehicles matching filter criteria (POST JSON body)' })
  countPost(@Body() body: SearchCriteriaDto) {
    return this.search.count(body);
  }

  @Public()
  @Get('specials')
  @ApiOperation({ summary: 'Vehicles on special (FR-23)' })
  specials(@Query() query: SearchVehiclesQueryDto) {
    return this.search.search({ ...query, collection: 'specials' });
  }

  @Public()
  @Get('hot-sellers')
  @ApiOperation({ summary: 'Popular, high-demand vehicles (FR-24)' })
  hotSellers(@Query() query: SearchVehiclesQueryDto) {
    return this.search.search({ ...query, collection: 'hot-sellers' });
  }

  @Public()
  @Get('compare')
  @ApiOperation({ summary: 'Compare 2-4 vehicles: price, engine, performance, consumption, dimensions, features, warranty (FR-17)' })
  compare(@Query() query: CompareVehiclesQueryDto) {
    return this.vehicles.compare(query.ids);
  }

  @OptionalAuth()
  @Get(':slugOrId')
  @ApiOperation({ summary: 'Vehicle detail page (FR-04). Signed-in viewers get it added to recently viewed (FR-41).' })
  detail(@Param('slugOrId') slugOrId: string, @CurrentUser() user?: AuthUser) {
    return this.vehicles.detail(slugOrId, user?.id);
  }

  @Public()
  @Get(':id/similar')
  similar(@Param('id', ParseUUIDPipe) id: string, @Query() query: RelatedQueryDto) {
    return this.vehicles.similar(id, query.limit);
  }

  @Public()
  @Get(':id/dealer-vehicles')
  dealerVehicles(@Param('id', ParseUUIDPipe) id: string, @Query() query: RelatedQueryDto) {
    return this.vehicles.fromSameDealer(id, query.limit);
  }

  @Public()
  @Get(':id/market-price')
  @ApiOperation({ summary: 'Average asking price of comparable listings' })
  marketPrice(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehicles.marketPrice(id);
  }
}

@ApiTags('Dealer portal: inventory')
@ApiBearerAuth()
@Controller('dealer/vehicles')
export class DealerVehiclesController {
  constructor(
    private readonly vehicles: VehiclesService,
    private readonly images: VehicleImagesService,
  ) {}

  private actor(dealer: DealerContext) {
    return { type: 'dealer' as const, userId: dealer.userId, dealer };
  }

  @Get()
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_VIEW] })
  @ApiOperation({ summary: 'My inventory (FR-13)' })
  list(@CurrentDealer() dealer: DealerContext, @Query() query: DealerVehicleQueryDto) {
    return this.vehicles.listForDealer(dealer, query);
  }

  @Post()
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_MANAGE] })
  @ApiOperation({ summary: 'Create a vehicle in DRAFT (FR-12, FR-47)' })
  create(@CurrentDealer() dealer: DealerContext, @Body() dto: CreateVehicleDto) {
    return this.vehicles.create(dealer, dto);
  }

  @Get(':id')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_VIEW] })
  get(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.vehicles.getForDealer(dealer, id);
  }

  @Patch(':id')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_MANAGE] })
  @ApiOperation({ summary: 'Edit a vehicle. After approval only price, specials, description, colour, branch, stock number and features may change.' })
  update(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehicles.update(dealer, id, dto);
  }

  @Post(':id/submit')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_MANAGE], requireApproved: true })
  @ApiOperation({ summary: 'Submit for admin review (DRAFT/REJECTED → PENDING_REVIEW)' })
  submit(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.vehicles.transition(id, VehicleStatus.PENDING_REVIEW, this.actor(dealer), { action: 'submit' });
  }

  @Post(':id/withdraw')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_MANAGE] })
  @ApiOperation({ summary: 'Withdraw from review (PENDING_REVIEW → DRAFT)' })
  withdraw(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.vehicles.transition(id, VehicleStatus.DRAFT, this.actor(dealer), { action: 'withdraw' });
  }

  @Post(':id/edit')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_MANAGE] })
  @ApiOperation({ summary: 'Move back to DRAFT for material edits (requires a new review)' })
  backToDraft(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.vehicles.transition(id, VehicleStatus.DRAFT, this.actor(dealer), { action: 'edit' });
  }

  @Post(':id/publish')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_PUBLISH], requireApproved: true })
  @ApiOperation({ summary: 'Publish an approved vehicle (BR-01, BR-02)' })
  publish(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.vehicles.transition(id, VehicleStatus.PUBLISHED, this.actor(dealer), { action: 'publish' });
  }

  @Post(':id/reserve')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_MANAGE] })
  @ApiOperation({ summary: 'Reserve a published vehicle (stays visible as reserved, BR-05)' })
  reserve(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReserveDto) {
    return this.vehicles.reserve(dealer, id, dto);
  }

  @Post(':id/release')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_MANAGE] })
  release(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.vehicles.transition(id, VehicleStatus.PUBLISHED, this.actor(dealer), { action: 'release' });
  }

  @Post(':id/sell')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_MANAGE] })
  @ApiOperation({ summary: 'Mark as sold (removed from search results, BR-04)' })
  sell(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: TransitionDto) {
    return this.vehicles.transition(id, VehicleStatus.SOLD, this.actor(dealer), { ...dto, action: 'sell' });
  }

  @Post(':id/suspend')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_MANAGE] })
  @ApiOperation({ summary: 'Temporarily take a listing offline (FR-12)' })
  suspend(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: TransitionDto) {
    return this.vehicles.transition(id, VehicleStatus.SUSPENDED, this.actor(dealer), { ...dto, action: 'suspend' });
  }

  @Post(':id/unsuspend')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_MANAGE], requireApproved: true })
  unsuspend(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.vehicles.transition(id, VehicleStatus.PUBLISHED, this.actor(dealer), { action: 'unsuspend' });
  }

  @Post(':id/archive')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_MANAGE] })
  @ApiOperation({ summary: 'Remove a listing (kept for history)' })
  archive(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: TransitionDto) {
    return this.vehicles.transition(id, VehicleStatus.ARCHIVED, this.actor(dealer), { ...dto, action: 'archive' });
  }

  @Get(':id/images')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_VIEW] })
  listImages(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.vehicles.getForDealer(dealer, id).then((vehicle) => vehicle.images);
  }

  @Post(':id/images/upload-url')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_MANAGE] })
  @ApiOperation({ summary: 'Step 1: get a presigned URL, then PUT the file to it' })
  uploadUrl(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ImageUploadRequestDto) {
    return this.images.requestUpload(dealer, id, dto);
  }

  @Post(':id/images/:imageId/complete')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_MANAGE] })
  @ApiOperation({ summary: 'Step 2: confirm the upload; resizing happens in the background' })
  completeUpload(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Param('imageId', ParseUUIDPipe) imageId: string) {
    return this.images.completeUpload(dealer, id, imageId);
  }

  @Put(':id/images/order')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_MANAGE] })
  reorder(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReorderImagesDto) {
    return this.images.reorder(dealer, id, dto.imageIds);
  }

  @Patch(':id/images/:imageId')
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_MANAGE] })
  updateImage(
    @CurrentDealer() dealer: DealerContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Body() dto: UpdateImageDto,
  ) {
    return this.images.update(dealer, id, imageId, dto);
  }

  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DealerAccess({ permissions: [DealerPermission.INVENTORY_MANAGE] })
  removeImage(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Param('imageId', ParseUUIDPipe) imageId: string) {
    return this.images.remove(dealer, id, imageId);
  }
}

@ApiTags('Admin: vehicles')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/vehicles')
export class AdminVehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  private actor(user: AuthUser) {
    return { type: 'admin' as const, userId: user.id };
  }

  @Get()
  list(@Query() query: AdminVehicleQueryDto) {
    return this.vehicles.listForAdmin(query);
  }

  @Get('review-queue')
  @ApiOperation({ summary: 'Listings awaiting approval, oldest first (BR-01)' })
  reviewQueue(@Query() query: PaginationQueryDto) {
    return this.vehicles.reviewQueue(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehicles.getForAdmin(id);
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleDto, @CurrentUser() user: AuthUser) {
    const current = await this.vehicles.getForAdmin(id);
    await this.vehicles.applyUpdate(current, dto, this.actor(user));
    return this.vehicles.getForAdmin(id);
  }

  @Patch(':id/flags')
  @ApiOperation({ summary: 'Feature a vehicle or mark it as special' })
  flags(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdminFlagsDto) {
    return this.vehicles.setAdminFlags(id, dto);
  }

  @Post(':id/approve')
  approve(@Param('id', ParseUUIDPipe) id: string, @Body() dto: TransitionDto, @CurrentUser() user: AuthUser) {
    return this.vehicles.transition(id, VehicleStatus.APPROVED, this.actor(user), { ...dto, action: 'approve' });
  }

  @Post(':id/reject')
  reject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: TransitionDto, @CurrentUser() user: AuthUser) {
    return this.vehicles.transition(id, VehicleStatus.REJECTED, this.actor(user), { ...dto, action: 'reject' });
  }

  @Post(':id/publish')
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.vehicles.transition(id, VehicleStatus.PUBLISHED, this.actor(user), { action: 'publish' });
  }

  @Post(':id/suspend')
  suspend(@Param('id', ParseUUIDPipe) id: string, @Body() dto: TransitionDto, @CurrentUser() user: AuthUser) {
    return this.vehicles.transition(id, VehicleStatus.SUSPENDED, this.actor(user), { ...dto, action: 'suspend' });
  }

  @Post(':id/unsuspend')
  unsuspend(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.vehicles.transition(id, VehicleStatus.PUBLISHED, this.actor(user), { action: 'unsuspend' });
  }

  @Post(':id/archive')
  archive(@Param('id', ParseUUIDPipe) id: string, @Body() dto: TransitionDto, @CurrentUser() user: AuthUser) {
    return this.vehicles.transition(id, VehicleStatus.ARCHIVED, this.actor(user), { ...dto, action: 'archive' });
  }

  @Post(':id/relist')
  @ApiOperation({ summary: 'Correct a mistaken sale: SOLD → PUBLISHED' })
  relist(@Param('id', ParseUUIDPipe) id: string, @Body() dto: TransitionDto, @CurrentUser() user: AuthUser) {
    return this.vehicles.transition(id, VehicleStatus.PUBLISHED, this.actor(user), { ...dto, action: 'relist' });
  }
}
