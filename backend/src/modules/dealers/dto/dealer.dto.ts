import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  DealerMemberRole,
  DealerMemberStatus,
  DealerPermission,
  DealerPlan,
  DealerStatus,
  Province,
} from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { PHONE_RULE, RegisterDto } from '../../auth/dto/auth.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const lower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export class OperatingHoursDto {
  @ApiProperty({ enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'PublicHoliday'] })
  @IsIn(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'PublicHoliday'])
  day: string;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @Matches(TIME)
  open?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsOptional()
  @Matches(TIME)
  close?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  closed?: boolean;
}

export class BranchInputDto {
  @ApiProperty({ example: 'Sandton' })
  @Transform(trim)
  @IsString()
  @Length(2, 120)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(lower)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(PHONE_RULE)
  phone?: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @Length(3, 300)
  address: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @Length(2, 120)
  city: string;

  @ApiProperty({ enum: Province })
  @IsEnum(Province)
  province: Province;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ type: [OperatingHoursDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => OperatingHoursDto)
  operatingHours?: OperatingHoursDto[];
}

export class UpdateBranchDto extends PartialType(BranchInputDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DealershipInputDto {
  @ApiProperty({ example: 'Sandton Auto' })
  @Transform(trim)
  @IsString()
  @Length(2, 120)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  legalName?: string;

  @ApiPropertyOptional({ description: 'CIPC company registration number' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  registrationNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  vatNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  dealerLicenceNumber?: string;

  @ApiProperty()
  @Transform(lower)
  @IsEmail()
  email: string;

  @ApiProperty()
  @Matches(PHONE_RULE, { message: 'phone must be a valid phone number' })
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiProperty({ enum: Province })
  @IsEnum(Province)
  province: Province;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @Length(2, 120)
  city: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @Length(3, 300)
  address: string;
}

/** FR-11: dealership + owner account + head-office branch in one request. */
export class RegisterDealerDto {
  @ApiProperty({ type: RegisterDto, description: 'Owner login credentials and contact person' })
  @ValidateNested()
  @Type(() => RegisterDto)
  owner: RegisterDto;

  @ApiProperty({ type: DealershipInputDto })
  @ValidateNested()
  @Type(() => DealershipInputDto)
  dealership: DealershipInputDto;

  @ApiPropertyOptional({ type: [OperatingHoursDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHoursDto)
  operatingHours?: OperatingHoursDto[];
}

export class UpdateDealerProfileDto extends PartialType(DealershipInputDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  logoUrl?: string;
}

export class DocumentUploadRequestDto {
  @ApiProperty({ enum: ['COMPANY_REGISTRATION', 'TAX_CLEARANCE', 'OWNER_ID', 'DEALER_LICENCE', 'PROOF_OF_ADDRESS', 'OTHER'] })
  @IsIn(['COMPANY_REGISTRATION', 'TAX_CLEARANCE', 'OWNER_ID', 'DEALER_LICENCE', 'PROOF_OF_ADDRESS', 'OTHER'])
  type: string;

  @ApiProperty()
  @IsString()
  @Length(1, 200)
  fileName: string;

  @ApiProperty({ enum: ['application/pdf', 'image/jpeg', 'image/png'] })
  @IsIn(['application/pdf', 'image/jpeg', 'image/png'])
  contentType: string;
}

export class ConfirmDocumentDto extends DocumentUploadRequestDto {
  @ApiProperty()
  @IsString()
  @Length(10, 300)
  storageKey: string;
}

export class CreateStaffDto {
  @ApiProperty()
  @Transform(lower)
  @IsEmail()
  email: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  firstName: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(PHONE_RULE)
  phone?: string;

  @ApiProperty({ enum: [DealerMemberRole.MANAGER, DealerMemberRole.SALES, DealerMemberRole.STAFF] })
  @IsIn([DealerMemberRole.MANAGER, DealerMemberRole.SALES, DealerMemberRole.STAFF])
  role: DealerMemberRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: DealerPermission, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(DealerPermission, { each: true })
  extraPermissions?: DealerPermission[];
}

export class UpdateStaffDto {
  @ApiPropertyOptional({ enum: [DealerMemberRole.MANAGER, DealerMemberRole.SALES, DealerMemberRole.STAFF] })
  @IsOptional()
  @IsIn([DealerMemberRole.MANAGER, DealerMemberRole.SALES, DealerMemberRole.STAFF])
  role?: DealerMemberRole;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  branchId?: string | null;

  @ApiPropertyOptional({ enum: DealerPermission, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(DealerPermission, { each: true })
  extraPermissions?: DealerPermission[];

  @ApiPropertyOptional({ enum: [DealerMemberStatus.ACTIVE, DealerMemberStatus.DISABLED] })
  @IsOptional()
  @IsIn([DealerMemberStatus.ACTIVE, DealerMemberStatus.DISABLED])
  status?: DealerMemberStatus;
}

export class PublicDealerQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: Province })
  @IsOptional()
  @IsEnum(Province)
  province?: Province;
}

export class AdminDealerQueryDto extends PublicDealerQueryDto {
  @ApiPropertyOptional({ enum: DealerStatus })
  @IsOptional()
  @IsEnum(DealerStatus)
  status?: DealerStatus;
}

export class ChangeDealerStatusDto {
  @ApiProperty({ enum: [DealerStatus.APPROVED, DealerStatus.REJECTED, DealerStatus.SUSPENDED] })
  @IsIn([DealerStatus.APPROVED, DealerStatus.REJECTED, DealerStatus.SUSPENDED])
  status: DealerStatus;

  @ApiPropertyOptional({ description: 'Required when rejecting or suspending' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class AdminUpdateDealerDto {
  @ApiPropertyOptional({ enum: DealerPlan })
  @IsOptional()
  @IsEnum(DealerPlan)
  plan?: DealerPlan;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  biddingEnabled?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;
}
