import { PublicCache } from '../../common/interceptors/cache-headers.interceptor';
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DealerPermission, UserRole } from '../../generated/prisma/client';
import { CurrentUser, Public, Roles } from '../../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/types/auth-user';
import { CurrentDealer, DealerAccess, DealerContext } from './dealer-access';
import { DealersService } from './dealers.service';
import {
  AdminDealerQueryDto,
  AdminUpdateDealerDto,
  BranchInputDto,
  ChangeDealerStatusDto,
  ConfirmDocumentDto,
  CreateStaffDto,
  DocumentUploadRequestDto,
  PublicDealerQueryDto,
  RegisterDealerDto,
  UpdateBranchDto,
  UpdateDealerProfileDto,
  UpdateStaffDto,
} from './dto/dealer.dto';

@ApiTags('Dealers (public)')
@Controller('dealers')
@PublicCache(300)
export class PublicDealersController {
  constructor(private readonly dealers: DealersService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a dealership (FR-11). Account starts PENDING until an admin approves it.' })
  register(@Body() dto: RegisterDealerDto) {
    return this.dealers.register(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Directory of approved dealers' })
  list(@Query() query: PublicDealerQueryDto) {
    return this.dealers.listPublic(query);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Public dealer page with branches and opening hours' })
  get(@Param('slug') slug: string) {
    return this.dealers.getPublic(slug);
  }
}

@ApiTags('Dealer portal: account')
@ApiBearerAuth()
@Controller('dealer')
export class DealerPortalController {
  constructor(private readonly dealers: DealersService) {}

  @Get('profile')
  @DealerAccess({ allowInactive: true })
  @ApiOperation({ summary: 'My dealership (FR-13 "view dealership information")' })
  profile(@CurrentDealer() dealer: DealerContext) {
    return this.dealers.getOwnProfile(dealer);
  }

  @Get('me')
  @DealerAccess({ allowInactive: true })
  @ApiOperation({ summary: 'My membership, role and effective permissions' })
  me(@CurrentDealer() dealer: DealerContext) {
    return dealer;
  }

  @Patch('profile')
  @DealerAccess({ permissions: [DealerPermission.DEALER_PROFILE_MANAGE] })
  updateProfile(@CurrentDealer() dealer: DealerContext, @Body() dto: UpdateDealerProfileDto) {
    return this.dealers.updateProfile(dealer, dto);
  }

  @Post('documents/upload-url')
  @DealerAccess({ permissions: [DealerPermission.DEALER_PROFILE_MANAGE], allowInactive: true })
  @ApiOperation({ summary: 'Presigned URL for a verification document upload' })
  documentUploadUrl(@CurrentDealer() dealer: DealerContext, @Body() dto: DocumentUploadRequestDto) {
    return this.dealers.documentUploadUrl(dealer, dto);
  }

  @Post('documents')
  @DealerAccess({ permissions: [DealerPermission.DEALER_PROFILE_MANAGE], allowInactive: true })
  @ApiOperation({ summary: 'Register an uploaded verification document' })
  confirmDocument(@CurrentDealer() dealer: DealerContext, @Body() dto: ConfirmDocumentDto) {
    return this.dealers.confirmDocument(dealer, dto);
  }

  @Get('documents')
  @DealerAccess({ permissions: [DealerPermission.DEALER_PROFILE_MANAGE], allowInactive: true })
  documents(@CurrentDealer() dealer: DealerContext) {
    return this.dealers.listDocuments(dealer.dealerId);
  }

  @Get('branches')
  @DealerAccess()
  branches(@CurrentDealer() dealer: DealerContext) {
    return this.dealers.listBranches(dealer);
  }

  @Post('branches')
  @DealerAccess({ permissions: [DealerPermission.BRANCHES_MANAGE] })
  createBranch(@CurrentDealer() dealer: DealerContext, @Body() dto: BranchInputDto) {
    return this.dealers.createBranch(dealer, dto);
  }

  @Patch('branches/:id')
  @DealerAccess({ permissions: [DealerPermission.BRANCHES_MANAGE] })
  updateBranch(@CurrentDealer() dealer: DealerContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBranchDto) {
    return this.dealers.updateBranch(dealer, id, dto);
  }

  @Get('staff')
  @DealerAccess({ anyPermission: [DealerPermission.STAFF_MANAGE, DealerPermission.LEADS_ASSIGN] })
  staff(@CurrentDealer() dealer: DealerContext) {
    return this.dealers.listStaff(dealer);
  }

  @Post('staff')
  @DealerAccess({ permissions: [DealerPermission.STAFF_MANAGE] })
  @ApiOperation({ summary: 'Create a staff account and email an invitation (FR-45)' })
  createStaff(@CurrentDealer() dealer: DealerContext, @Body() dto: CreateStaffDto) {
    return this.dealers.createStaff(dealer, dto);
  }

  @Patch('staff/:memberId')
  @DealerAccess({ permissions: [DealerPermission.STAFF_MANAGE] })
  @ApiOperation({ summary: 'Change role, branch, permissions or disable a staff account' })
  updateStaff(@CurrentDealer() dealer: DealerContext, @Param('memberId', ParseUUIDPipe) memberId: string, @Body() dto: UpdateStaffDto) {
    return this.dealers.updateStaff(dealer, memberId, dto);
  }

  @Get('staff/:memberId/activity')
  @DealerAccess({ permissions: [DealerPermission.STAFF_MANAGE] })
  staffActivity(@CurrentDealer() dealer: DealerContext, @Param('memberId', ParseUUIDPipe) memberId: string, @Query() query: PaginationQueryDto) {
    return this.dealers.staffActivity(dealer, memberId, query);
  }
}

@ApiTags('Admin: dealers')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/dealers')
export class AdminDealersController {
  constructor(private readonly dealers: DealersService) {}

  @Get()
  list(@Query() query: AdminDealerQueryDto) {
    return this.dealers.adminList(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.dealers.adminGet(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Approve, reject, suspend or reinstate a dealer (FR-11, FR-34)' })
  changeStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangeDealerStatusDto, @CurrentUser() admin: AuthUser) {
    return this.dealers.changeStatus(id, dto, admin.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update plan, bidding eligibility or rating' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdminUpdateDealerDto) {
    return this.dealers.adminUpdate(id, dto);
  }
}
