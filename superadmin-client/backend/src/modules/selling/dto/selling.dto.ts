import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ConditionGrade, FuelType, Province, SellRequestStatus, SellRequestType, Transmission } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { ALLOWED_IMAGE_TYPES } from '../../../infrastructure/storage/storage.service';
import { ContactDto } from '../../enquiries/dto/enquiry.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** FR-08 sell-your-vehicle / FR-09 valuation request: personal info + vehicle info in one submission. */
export class CreateSellRequestDto extends ContactDto {
  @ApiProperty({ enum: SellRequestType, description: 'SELL = wants offers, VALUATION = estimate only' }) @IsEnum(SellRequestType) type: SellRequestType;
  @ApiProperty({ enum: Province }) @IsEnum(Province) province: Province;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(120) city?: string;

  @ApiPropertyOptional({ description: 'Catalogue ids give the most accurate valuation' }) @IsOptional() @IsUUID() makeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() modelId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiPropertyOptional({ description: 'Required when makeId is not given' }) @ValidateIf((dto) => !dto.makeId) @Transform(trim) @IsString() @Length(1, 80) makeName?: string;
  @ApiPropertyOptional({ description: 'Required when modelId is not given' }) @ValidateIf((dto) => !dto.modelId) @Transform(trim) @IsString() @Length(1, 80) modelName?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(120) variantName?: string;

  @ApiProperty() @IsInt() @Min(1950) @Max(new Date().getFullYear() + 1) year: number;
  @ApiProperty() @IsInt() @Min(0) @Max(2_000_000) mileage: number;
  @ApiProperty({ enum: ConditionGrade }) @IsEnum(ConditionGrade) condition: ConditionGrade;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) colour?: string;
  @ApiPropertyOptional({ enum: Transmission }) @IsOptional() @IsEnum(Transmission) transmission?: Transmission;
  @ApiPropertyOptional({ enum: FuelType }) @IsOptional() @IsEnum(FuelType) fuelType?: FuelType;
  @ApiPropertyOptional({ description: 'Registration number (FR-09). Never shown to dealers before acceptance.' }) @IsOptional() @Transform(trim) @IsString() @MaxLength(20) registrationNumber?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value)) @Matches(/^[A-HJ-NPR-Z0-9]{11,17}$/) vin?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasServiceHistory?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasAccidentHistory?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasOutstandingFinance?: boolean;
  @ApiPropertyOptional({ description: 'Price the customer hopes for' }) @IsOptional() @IsInt() @Min(0) askingPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4000) notes?: string;
}

export class SellImageUploadDto {
  @ApiProperty({ enum: ALLOWED_IMAGE_TYPES }) @IsIn(ALLOWED_IMAGE_TYPES as unknown as string[]) contentType: string;
}

export class ConfirmSellImageDto {
  @ApiProperty() @IsString() @Length(10, 300) storageKey: string;
  @ApiProperty({ enum: ALLOWED_IMAGE_TYPES }) @IsIn(ALLOWED_IMAGE_TYPES as unknown as string[]) contentType: string;
}

export class SellRequestQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SellRequestStatus }) @IsOptional() @IsEnum(SellRequestStatus) status?: SellRequestStatus;
  @ApiPropertyOptional({ enum: SellRequestType }) @IsOptional() @IsEnum(SellRequestType) type?: SellRequestType;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) q?: string;
}

export class ManualValuationDto {
  @ApiProperty() @IsInt() @Min(0) estimateLow: number;
  @ApiProperty() @IsInt() @Min(0) estimateMid: number;
  @ApiProperty() @IsInt() @Min(0) estimateHigh: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class AdminSellStatusDto {
  @ApiProperty({ enum: [SellRequestStatus.UNDER_REVIEW, SellRequestStatus.REJECTED, SellRequestStatus.COMPLETED, SellRequestStatus.CANCELLED] })
  @IsIn([SellRequestStatus.UNDER_REVIEW, SellRequestStatus.REJECTED, SellRequestStatus.COMPLETED, SellRequestStatus.CANCELLED])
  status: SellRequestStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) reason?: string;
}
