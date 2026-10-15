import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Drivetrain, FeatureAvailability, FuelType, Transmission } from '../../../generated/prisma/client';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const YEAR_MIN = 1900;
const YEAR_MAX = new Date().getFullYear() + 2;

export class CreateMakeDto {
  @ApiProperty({ example: 'BMW' })
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'Germany' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
export class UpdateMakeDto extends PartialType(CreateMakeDto) {}

export class CreateModelDto {
  @ApiProperty()
  @IsUUID()
  makeId: string;

  @ApiProperty({ example: '3 Series' })
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  defaultCategoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
export class UpdateModelDto extends PartialType(OmitType(CreateModelDto, ['makeId'] as const)) {}

export class CreateGenerationDto {
  @ApiProperty()
  @IsUUID()
  modelId: string;

  @ApiProperty({ example: 'G20' })
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  name: string;

  @ApiProperty({ example: 2019 })
  @IsInt()
  @Min(YEAR_MIN)
  @Max(YEAR_MAX)
  yearFrom: number;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @IsInt()
  @Min(YEAR_MIN)
  @Max(YEAR_MAX)
  yearTo?: number;
}
export class UpdateGenerationDto extends PartialType(OmitType(CreateGenerationDto, ['modelId'] as const)) {}

export class SpecificationDto {
  @ApiPropertyOptional({ example: '2.0L 4-cylinder turbo petrol' }) @IsOptional() @IsString() @MaxLength(120) engine?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(20000) engineCapacityCc?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(32) cylinders?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(2000) powerKw?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(3000) torqueNm?: number;
  @ApiPropertyOptional({ enum: Transmission }) @IsOptional() @IsEnum(Transmission) transmission?: Transmission;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(12) gears?: number;
  @ApiPropertyOptional({ enum: Drivetrain }) @IsOptional() @IsEnum(Drivetrain) drivetrain?: Drivetrain;
  @ApiPropertyOptional({ enum: FuelType }) @IsOptional() @IsEnum(FuelType) fuelType?: FuelType;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(50) fuelConsumptionL100?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(1000) co2GKm?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(60) seats?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(6) doors?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(30000) lengthMm?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(5000) widthMm?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(5000) heightMm?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(10000) wheelbaseMm?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(10000) bootLitres?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(50000) kerbWeightKg?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(1000) fuelTankLitres?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(500) topSpeedKmh?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(60) zeroTo100Sec?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(500) batteryKwh?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(2000) electricRangeKm?: number;
  @ApiPropertyOptional({ example: '5 years / 100 000 km' }) @IsOptional() @IsString() @MaxLength(200) warranty?: string;
  @ApiPropertyOptional({ example: '5 years / 100 000 km' }) @IsOptional() @IsString() @MaxLength(200) servicePlan?: string;
  @ApiPropertyOptional({ example: '5-star Euro NCAP' }) @IsOptional() @IsString() @MaxLength(100) safetyRating?: string;
  @ApiPropertyOptional({ description: 'Other technical specifications as key/value pairs' }) @IsOptional() @IsObject() extra?: Record<string, string | number | boolean>;
}

export class CreateVariantDto {
  @ApiProperty()
  @IsUUID()
  modelId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  generationId?: string;

  @ApiProperty({ example: '320i M Sport' })
  @Transform(trim)
  @IsString()
  @Length(1, 120)
  name: string;

  @ApiProperty({ example: 2022 })
  @IsInt()
  @Min(YEAR_MIN)
  @Max(YEAR_MAX)
  yearFrom: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(YEAR_MIN)
  @Max(YEAR_MAX)
  yearTo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bodyCategoryId?: string;

  @ApiPropertyOptional({ description: 'List price in rand (new vehicles)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: SpecificationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SpecificationDto)
  specification?: SpecificationDto;
}
export class UpdateVariantDto extends PartialType(OmitType(CreateVariantDto, ['modelId'] as const)) {}

export class CategoryDto {
  @ApiProperty({ example: 'SUVs' })
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
export class UpdateCategoryDto extends PartialType(CategoryDto) {}

export const FEATURE_GROUPS = ['SAFETY', 'COMFORT', 'TECHNOLOGY', 'EXTERIOR', 'INTERIOR', 'PERFORMANCE', 'OTHER'] as const;

export class FeatureDto {
  @ApiProperty({ example: 'Adaptive cruise control' })
  @Transform(trim)
  @IsString()
  @Length(1, 120)
  name: string;

  @ApiPropertyOptional({ enum: FEATURE_GROUPS })
  @IsOptional()
  @IsIn(FEATURE_GROUPS)
  group?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
export class UpdateFeatureDto extends PartialType(FeatureDto) {}

/** Assign a feature to exactly one catalogue level (FR-50). */
export class AssignFeatureDto {
  @ApiProperty()
  @IsUUID()
  featureId: string;

  @ApiProperty({ enum: FeatureAvailability })
  @IsEnum(FeatureAvailability)
  availability: FeatureAvailability;

  @ApiProperty({ enum: ['make', 'model', 'generation', 'variant'] })
  @IsIn(['make', 'model', 'generation', 'variant'])
  level: 'make' | 'model' | 'generation' | 'variant';

  @ApiProperty()
  @IsUUID()
  targetId: string;
}

export class CompareQueryDto {
  @ApiProperty({ description: 'Comma-separated ids (2-4)', example: 'id1,id2' })
  @IsString()
  @MaxLength(200)
  ids: string;
}
