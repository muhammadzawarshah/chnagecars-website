import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, Roles } from '../../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ParseMarketplaceIdPipe } from '../../common/pipes/marketplace-id.pipe';
import type { AuthUser } from '../../common/types/auth-user';
import { UserRole, VehicleStatus } from '../../generated/prisma/client';
import { UpdateDealerProfileDto } from '../dealers/dto/dealer.dto';
import { CreateVehicleDto, DealerVehicleQueryDto, ImageUploadRequestDto, ReorderImagesDto, UpdateImageDto, UpdateVehicleDto } from '../vehicles/dto/vehicle.dto';
import { VehiclesService } from '../vehicles/vehicles.service';
import { VehicleImagesService } from '../vehicles/vehicle-images.service';
import { DealerAppTokensService } from './dealer-app-tokens.service';
import { CreateDealerAppTokenDto } from './dealer-app.dto';
import { AppScopes, CurrentDealerApp, DealerAppAuth } from './dealer-app.guard';
import type { DealerAppContext } from './dealer-app.guard';
import { DealerAppService } from './dealer-app.service';

@ApiTags('Admin: dealer app tokens')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/dealers/:dealerId/app-tokens')
export class AdminDealerAppTokensController {
  constructor(private readonly tokens: DealerAppTokensService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a dealer-bound app token. The secret is returned only once.' })
  create(@Param('dealerId', ParseMarketplaceIdPipe) dealerId: string, @Body() dto: CreateDealerAppTokenDto, @CurrentUser() user: AuthUser) {
    return this.tokens.issue(dealerId, dto, user.id);
  }

  @Get()
  list(@Param('dealerId', ParseMarketplaceIdPipe) dealerId: string, @Query() query: PaginationQueryDto) {
    return this.tokens.list(dealerId, query);
  }

  @Delete(':tokenId')
  @ApiOperation({ summary: 'Revoke a token immediately; repeated revocations are safe.' })
  revoke(@Param('dealerId', ParseMarketplaceIdPipe) dealerId: string, @Param('tokenId', ParseUUIDPipe) tokenId: string) {
    return this.tokens.revoke(dealerId, tokenId);
  }
}

@ApiTags('Dealer app')
@ApiBearerAuth()
@DealerAppAuth()
@Controller('dealer-app')
export class DealerAppController {
  constructor(private readonly app: DealerAppService, private readonly vehicles: VehiclesService, private readonly images: VehicleImagesService) {}

  @Get('bootstrap')
  @AppScopes('dealer:read', 'vehicles:read')
  @ApiOperation({ summary: 'This token’s dealership and a paginated inventory, including total vehicle count.' })
  bootstrap(@CurrentDealerApp() app: DealerAppContext, @Query() query: DealerVehicleQueryDto) {
    return this.app.bootstrap(app, query);
  }

  @Get('profile')
  @AppScopes('dealer:read')
  profile(@CurrentDealerApp() app: DealerAppContext) { return this.app.profile(app); }

  @Patch('profile')
  @AppScopes('dealer:write')
  updateProfile(@CurrentDealerApp() app: DealerAppContext, @Body() dto: UpdateDealerProfileDto) { return this.app.updateProfile(app, dto); }

  @Get('vehicles')
  @AppScopes('vehicles:read')
  list(@CurrentDealerApp() app: DealerAppContext, @Query() query: DealerVehicleQueryDto) { return this.app.inventory(app, query); }

  @Post('vehicles')
  @AppScopes('vehicles:write')
  create(@CurrentDealerApp() app: DealerAppContext, @Body() dto: CreateVehicleDto) { return this.app.createVehicle(app, dto); }

  @Get('vehicles/:id')
  @AppScopes('vehicles:read')
  get(@CurrentDealerApp() app: DealerAppContext, @Param('id', ParseMarketplaceIdPipe) id: string) { return this.vehicles.getForDealer(app, id); }

  @Patch('vehicles/:id')
  @AppScopes('vehicles:write')
  update(@CurrentDealerApp() app: DealerAppContext, @Param('id', ParseMarketplaceIdPipe) id: string, @Body() dto: UpdateVehicleDto) { return this.app.updateVehicle(app, id, dto); }

  @Delete('vehicles/:id')
  @AppScopes('vehicles:write')
  @ApiOperation({ summary: 'Remove this dealer’s vehicle from listings (archive, preserving history).' })
  remove(@CurrentDealerApp() app: DealerAppContext, @Param('id', ParseMarketplaceIdPipe) id: string) { return this.app.removeVehicle(app, id); }

  @Post('vehicles/:id/submit')
  @AppScopes('vehicles:write')
  submit(@CurrentDealerApp() app: DealerAppContext, @Param('id', ParseMarketplaceIdPipe) id: string) { return this.app.action(app, id, VehicleStatus.PENDING_REVIEW, 'submit'); }

  @Post('vehicles/:id/withdraw')
  @AppScopes('vehicles:write')
  withdraw(@CurrentDealerApp() app: DealerAppContext, @Param('id', ParseMarketplaceIdPipe) id: string) { return this.app.action(app, id, VehicleStatus.DRAFT, 'withdraw'); }

  @Post('vehicles/:id/edit')
  @AppScopes('vehicles:write')
  edit(@CurrentDealerApp() app: DealerAppContext, @Param('id', ParseMarketplaceIdPipe) id: string) { return this.app.action(app, id, VehicleStatus.DRAFT, 'edit'); }

  @Post('vehicles/:id/publish')
  @AppScopes('vehicles:write')
  publish(@CurrentDealerApp() app: DealerAppContext, @Param('id', ParseMarketplaceIdPipe) id: string) { return this.app.action(app, id, VehicleStatus.PUBLISHED, 'publish'); }

  @Post('vehicles/:id/images/upload-url')
  @AppScopes('vehicles:write')
  upload(@CurrentDealerApp() app: DealerAppContext, @Param('id', ParseMarketplaceIdPipe) id: string, @Body() dto: ImageUploadRequestDto) { return this.images.requestUpload(app, id, dto); }

  @Post('vehicles/:id/images/:imageId/complete')
  @AppScopes('vehicles:write')
  complete(@CurrentDealerApp() app: DealerAppContext, @Param('id', ParseMarketplaceIdPipe) id: string, @Param('imageId', ParseUUIDPipe) imageId: string) { return this.images.completeUpload(app, id, imageId); }

  @Put('vehicles/:id/images/order')
  @AppScopes('vehicles:write')
  reorder(@CurrentDealerApp() app: DealerAppContext, @Param('id', ParseMarketplaceIdPipe) id: string, @Body() dto: ReorderImagesDto) { return this.images.reorder(app, id, dto.imageIds); }

  @Patch('vehicles/:id/images/:imageId')
  @AppScopes('vehicles:write')
  updateImage(@CurrentDealerApp() app: DealerAppContext, @Param('id', ParseMarketplaceIdPipe) id: string, @Param('imageId', ParseUUIDPipe) imageId: string, @Body() dto: UpdateImageDto) { return this.images.update(app, id, imageId, dto); }

  @Delete('vehicles/:id/images/:imageId')
  @AppScopes('vehicles:write')
  removeImage(@CurrentDealerApp() app: DealerAppContext, @Param('id', ParseMarketplaceIdPipe) id: string, @Param('imageId', ParseUUIDPipe) imageId: string) { return this.images.remove(app, id, imageId); }
}
