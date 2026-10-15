import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  Drivetrain,
  FuelType,
  Province,
  Transmission,
  VehicleCondition,
  VehicleStatus,
} from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { ALLOWED_IMAGE_TYPES } from '../../../infrastructure/storage/storage.service';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const YEAR_MAX = new Date().getFullYear() + 1;

export class CreateVehicleDto {
  @ApiProperty() @IsUUID() makeId: string;
  @ApiProperty() @IsUUID() modelId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() generationId?: string;
  @ApiPropertyOptional({ description: 'Strongly recommended: fills specs from the catalogue' }) @IsOptional() @IsUUID() variantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;

  @ApiProperty({ enum: VehicleCondition }) @IsEnum(VehicleCondition) condition: VehicleCondition;
  @ApiProperty({ example: 2021 }) @IsInt() @Min(1900) @Max(YEAR_MAX) year: number;
  @ApiProperty({ example: 45000 }) @IsInt() @Min(0) @Max(2_000_000) mileage: number;
  @ApiProperty({ example: 459900, description: 'Rand' }) @IsInt() @Min(1000) @Max(100_000_000) price: number;

  @ApiPropertyOptional({ description: 'Defaults to "<year> <make> <model> <variant>"' })
  @IsOptional() @Transform(trim) @IsString() @Length(3, 160) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10000) description?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(60) stockNumber?: string;

  @ApiPropertyOptional({ enum: Transmission }) @IsOptional() @IsEnum(Transmission) transmission?: Transmission;
  @ApiPropertyOptional({ enum: FuelType }) @IsOptional() @IsEnum(FuelType) fuelType?: FuelType;
  @ApiPropertyOptional({ enum: Drivetrain }) @IsOptional() @IsEnum(Drivetrain) drivetrain?: Drivetrain;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(40) colour?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(20000) engineCapacityCc?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(2000) powerKw?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(32) cylinders?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(60) seats?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(6) doors?: number;

  @ApiPropertyOptional({ description: 'Private, never shown publicly' })
  @IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value)) @Matches(/^[A-HJ-NPR-Z0-9]{11,17}$/, { message: 'vin must be a valid VIN' }) vin?: string;
  @ApiPropertyOptional({ description: 'Private, never shown publicly' }) @IsOptional() @Transform(trim) @IsString() @MaxLength(20) registrationNumber?: string;

  @ApiPropertyOptional({ enum: Province, description: 'Defaults to the branch/dealer province' }) @IsOptional() @IsEnum(Province) province?: Province;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(120) city?: string;
  @ApiPropertyOptional() @IsOptional() @IsLatitude() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsLongitude() longitude?: number;

  @ApiPropertyOptional({ description: 'Extra category ids; body and fuel categories are assigned automatically', type: [String] })
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsUUID('all', { each: true }) categoryIds?: string[];
  @ApiPropertyOptional({ description: 'Vehicle-level feature ids (FR-50)', type: [String] })
  @IsOptional() @IsArray() @ArrayMaxSize(200) @IsUUID('all', { each: true }) featureIds?: string[];

  @ApiPropertyOptional() @IsOptional() @IsBoolean() isSpecial?: boolean;
  @ApiPropertyOptional({ description: 'Promotional price when on special (FR-23)' }) @IsOptional() @IsInt() @Min(1000) specialPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() promotionId?: string;
}

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @ApiPropertyOptional({ description: 'Optimistic concurrency: the version you last read' })
  @IsOptional()
  @IsInt()
  expectedVersion?: number;
}

export class TransitionDto {
  @ApiPropertyOptional({ description: 'Reason (required for reject and admin suspend)' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class ReserveDto extends TransitionDto {
  @ApiPropertyOptional({ description: 'Reservation expiry; defaults to RESERVATION_HOLD_HOURS from now' })
  @IsOptional()
  @IsDateString()
  reservedUntil?: string;
}

export class DealerVehicleQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: VehicleStatus, isArray: true, description: 'Comma-separated statuses' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map((item: string) => item.trim()) : value))
  @IsArray()
  @IsEnum(VehicleStatus, { each: true })
  status?: VehicleStatus[];

  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) q?: string;

  @ApiPropertyOptional({ enum: ['recent', 'price-asc', 'price-desc', 'views-desc'] })
  @IsOptional()
  @IsIn(['recent', 'price-asc', 'price-desc', 'views-desc'])
  sort?: string;
}

export class AdminVehicleQueryDto extends DealerVehicleQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() dealerId?: string;
}

export class ImageUploadRequestDto {
  @ApiProperty({ enum: ALLOWED_IMAGE_TYPES })
  @IsIn(ALLOWED_IMAGE_TYPES as unknown as string[])
  contentType: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsInt()
  @Min(1)
  sizeBytes: number;
}

export class ReorderImagesDto {
  @ApiProperty({ type: [String], description: 'Image ids in display order; the first becomes primary' })
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true })
  imageIds: string[];
}

export class UpdateImageDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) altText?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class AdminFlagsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isSpecial?: boolean;
}

export class CompareVehiclesQueryDto {
  @ApiProperty({ description: 'Comma-separated vehicle ids (2-4)' })
  @IsString()
  @MaxLength(200)
  ids: string;
}

export class RelatedQueryDto {
  @ApiPropertyOptional({ default: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  limit?: number;
}
