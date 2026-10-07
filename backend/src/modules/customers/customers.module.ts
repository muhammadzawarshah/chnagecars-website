import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Module, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/types/auth-user';
import { CustomersService } from './customers.service';
import { CreateSavedSearchDto, DeleteAccountDto, UpdateProfileDto, UpdateSavedSearchDto } from './dto/customer.dto';

@ApiTags('Customer: account & dashboard')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'My profile (FR-01)' })
  profile(@CurrentUser() user: AuthUser) {
    return this.customers.profile(user.id);
  }

  @Patch()
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.customers.updateProfile(user.id, dto);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Personal dashboard: enquiries, valuations, offers, favourites, saved searches, history, notifications (FR-40)' })
  dashboard(@CurrentUser() user: AuthUser) {
    return this.customers.dashboard(user.id);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Signed-in devices (security settings)' })
  sessions(@CurrentUser() user: AuthUser) {
    return this.customers.sessions(user.id, user.sessionId);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeSession(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.customers.revokeSession(user.id, id);
  }

  @Get('favourites')
  @ApiOperation({ summary: 'Saved vehicles, kept across sessions and devices (FR-37)' })
  favourites(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.customers.favourites(user.id, query);
  }

  @Get('favourites/ids')
  @ApiOperation({ summary: 'Ids of saved vehicles (to render heart icons)' })
  favouriteIds(@CurrentUser() user: AuthUser) {
    return this.customers.favouriteIds(user.id);
  }

  @Put('favourites/:vehicleId')
  addFavourite(@CurrentUser() user: AuthUser, @Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.customers.addFavourite(user.id, vehicleId);
  }

  @Delete('favourites/:vehicleId')
  removeFavourite(@CurrentUser() user: AuthUser, @Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.customers.removeFavourite(user.id, vehicleId);
  }

  @Get('saved-searches')
  @ApiOperation({ summary: 'Saved searches (FR-38)' })
  savedSearches(@CurrentUser() user: AuthUser) {
    return this.customers.savedSearches(user.id);
  }

  @Post('saved-searches')
  createSavedSearch(@CurrentUser() user: AuthUser, @Body() dto: CreateSavedSearchDto) {
    return this.customers.createSavedSearch(user.id, dto);
  }

  @Patch('saved-searches/:id')
  @ApiOperation({ summary: 'Rename, change criteria or toggle alerts' })
  updateSavedSearch(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSavedSearchDto) {
    return this.customers.updateSavedSearch(user.id, id, dto);
  }

  @Delete('saved-searches/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSavedSearch(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.customers.deleteSavedSearch(user.id, id);
  }

  @Get('recently-viewed')
  @ApiOperation({ summary: 'Recently viewed vehicles (FR-41)' })
  recentlyViewed(@CurrentUser() user: AuthUser) {
    return this.customers.recentlyViewed(user.id);
  }

  @Delete('recently-viewed')
  clearRecentlyViewed(@CurrentUser() user: AuthUser) {
    return this.customers.clearRecentlyViewed(user.id);
  }

  @Get('export')
  @ApiOperation({ summary: 'Download all my personal data (NFR-17)' })
  exportData(@CurrentUser() user: AuthUser) {
    return this.customers.exportData(user.id);
  }

  @Post('delete-account')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete my account: personal data is anonymised (NFR-17)' })
  deleteAccount(@CurrentUser() user: AuthUser, @Body() dto: DeleteAccountDto) {
    return this.customers.deleteAccount(user.id, dto.password);
  }
}

@Module({
  controllers: [MeController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
