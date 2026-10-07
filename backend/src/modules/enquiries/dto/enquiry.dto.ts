import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  Equals,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
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
  ValidateNested,
} from 'class-validator';
import { ConditionGrade, EnquiryStatus, EnquiryType, Province } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { PHONE_RULE } from '../../auth/dto/auth.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const lower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

/** Contact details captured by every enquiry form (FR-14). */
export class ContactDto {
  @ApiProperty({ example: 'Thabo Nkosi' }) @Transform(trim) @IsString() @Length(2, 160) name: string;
  @ApiProperty() @Transform(lower) @IsEmail() @MaxLength(254) email: string;
  @ApiProperty({ example: '+27 82 123 4567' }) @Transform(trim) @Matches(PHONE_RULE, { message: 'phone must be a valid phone number' }) phone: string;
  @ApiProperty({ description: 'Consent to be contacted about this request (POPIA / NFR-17)' })
  @Equals(true, { message: 'Consent is required to submit this request' })
  consent: boolean;
}

export class VehicleEnquiryDto extends ContactDto {
  @ApiProperty() @IsUUID() vehicleId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4000) message?: string;
  @ApiPropertyOptional({ description: 'Customer would like finance' }) @IsOptional() @IsBoolean() interestedInFinance?: boolean;
  @ApiPropertyOptional({ description: 'Customer has a vehicle to trade in' }) @IsOptional() @IsBoolean() hasTradeIn?: boolean;
}

export class TestDriveDto extends ContactDto {
  @ApiProperty() @IsUUID() vehicleId: string;
  @ApiProperty({ description: 'Preferred date/time (ISO 8601)' }) @IsDateString() preferredAt: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) message?: string;
}

/** FR-15 / FR-06: quote for a (new) vehicle from the catalogue. */
export class QuoteRequestDto extends ContactDto {
  @ApiProperty() @IsUUID() makeId: string;
  @ApiProperty() @IsUUID() modelId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiPropertyOptional({ description: 'Send to a specific dealer; otherwise the platform team handles it' }) @IsOptional() @IsUUID() dealerId?: string;
  @ApiProperty({ enum: Province }) @IsEnum(Province) province: Province;
  @ApiPropertyOptional({ description: 'Colour, extras, timing, finance needs...' }) @IsOptional() @IsString() @MaxLength(4000) requirements?: string;
}

/** FR-16 Beat My Quote. */
export class BeatMyQuoteDto extends ContactDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() makeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() modelId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiProperty({ description: 'Desired vehicle as quoted', example: '2025 Toyota Hilux 2.8 GD-6 Legend' }) @Transform(trim) @IsString() @Length(3, 200) desiredVehicle: string;
  @ApiProperty({ description: 'Quoted price in rand' }) @IsInt() @Min(1000) @Max(100_000_000) quotedPrice: number;
  @ApiProperty({ description: 'Dealer that issued the existing quote' }) @Transform(trim) @IsString() @Length(2, 200) quotingDealer: string;
  @ApiPropertyOptional({ description: 'Quote details / reference / included extras' }) @IsOptional() @IsString() @MaxLength(4000) quoteDetails?: string;
  @ApiProperty({ enum: Province }) @IsEnum(Province) province: Province;
}

export class TradeInVehicleDto {
  @ApiProperty({ example: 'Volkswagen' }) @Transform(trim) @IsString() @Length(1, 80) make: string;
  @ApiProperty({ example: 'Polo' }) @Transform(trim) @IsString() @Length(1, 80) model: string;
  @ApiPropertyOptional({ example: '1.0 TSI Comfortline' }) @IsOptional() @IsString() @MaxLength(120) variant?: string;
  @ApiProperty() @IsInt() @Min(1950) @Max(2100) year: number;
  @ApiProperty() @IsInt() @Min(0) @Max(2_000_000) mileage: number;
  @ApiProperty({ enum: ConditionGrade }) @IsEnum(ConditionGrade) condition: ConditionGrade;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasServiceHistory?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasOutstandingFinance?: boolean;
}

/** FR-20 trade-in when buying another vehicle. */
export class TradeInDto extends ContactDto {
  @ApiPropertyOptional({ description: 'Listed vehicle the customer wants (routes to its dealer)' }) @IsOptional() @IsUUID() vehicleId?: string;
  @ApiPropertyOptional({ description: 'Desired replacement vehicle if not a specific listing' }) @IsOptional() @IsString() @MaxLength(200) desiredVehicle?: string;
  @ApiProperty({ type: TradeInVehicleDto }) @ValidateNested() @Type(() => TradeInVehicleDto) tradeIn: TradeInVehicleDto;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) message?: string;
}

export const CONCIERGE_SERVICES = [
  'VEHICLE_SOURCING',
  'RECOMMENDATIONS',
  'PRICE_NEGOTIATION',
  'VEHICLE_CHECKS',
  'FINANCE_ASSISTANCE',
  'WARRANTY_ASSISTANCE',
  'INSURANCE_ASSISTANCE',
  'DOCUMENTATION_ASSISTANCE',
  'DELIVERY_COORDINATION',
] as const;

/** FR-21 concierge service. */
export class ConciergeDto extends ContactDto {
  @ApiProperty({ enum: CONCIERGE_SERVICES, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(CONCIERGE_SERVICES.length)
  @IsIn(CONCIERGE_SERVICES, { each: true })
  services: string[];
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) budget?: number;
  @ApiPropertyOptional() @IsOptional() @IsEnum(Province) province?: Province;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4000) notes?: string;
}

/** FR-22 help me find a vehicle. */
export class HelpMeFindDto extends ContactDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() makeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() modelId?: string;
  @ApiPropertyOptional({ description: 'Category slug, e.g. suvs' }) @IsOptional() @IsString() @MaxLength(80) vehicleType?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) budgetMin?: number;
  @ApiProperty() @IsInt() @Min(1000) budgetMax: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1950) minYear?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) maxMileage?: number;
  @ApiPropertyOptional() @IsOptional() @IsEnum(Province) province?: Province;
  @ApiPropertyOptional({ description: 'Colour, transmission, fuel, must-have features...' }) @IsOptional() @IsString() @MaxLength(4000) preferences?: string;
}

/** Finance enquiry (FR-33), optionally for a listed vehicle. */
export class FinanceEnquiryDto extends ContactDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() vehicleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) vehiclePrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) deposit?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(6) @Max(96) termMonths?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) monthlyIncome?: number;
  @ApiPropertyOptional({ enum: ['EMPLOYED', 'SELF_EMPLOYED', 'CONTRACT', 'PENSIONER', 'OTHER'] })
  @IsOptional()
  @IsIn(['EMPLOYED', 'SELF_EMPLOYED', 'CONTRACT', 'PENSIONER', 'OTHER'])
  employmentStatus?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) message?: string;
}

/** FR-30 insurance quote request. */
export class InsuranceEnquiryDto extends ContactDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() vehicleId?: string;
  @ApiPropertyOptional({ example: '2022 Toyota Corolla Cross 1.8 Xi' }) @IsOptional() @IsString() @MaxLength(200) vehicleDescription?: string;
  @ApiPropertyOptional({ enum: ['COMPREHENSIVE', 'THIRD_PARTY_FIRE_THEFT', 'THIRD_PARTY', 'NOT_SURE'] })
  @IsOptional()
  @IsIn(['COMPREHENSIVE', 'THIRD_PARTY_FIRE_THEFT', 'THIRD_PARTY', 'NOT_SURE'])
  coverType?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(Province) province?: Province;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) message?: string;
}

export class GeneralContactDto extends ContactDto {
  @ApiProperty() @Transform(trim) @IsString() @Length(2, 200) subject: string;
  @ApiProperty() @IsString() @Length(2, 4000) message: string;
}

export class RespondDto {
  @ApiProperty() @IsString() @Length(1, 4000) message: string;
  @ApiPropertyOptional({ enum: [EnquiryStatus.IN_PROGRESS, EnquiryStatus.RESPONDED, EnquiryStatus.CLOSED], default: EnquiryStatus.RESPONDED })
  @IsOptional()
  @IsIn([EnquiryStatus.IN_PROGRESS, EnquiryStatus.RESPONDED, EnquiryStatus.CLOSED])
  status?: EnquiryStatus;
}

export class CustomerReplyDto {
  @ApiProperty() @IsString() @Length(1, 4000) message: string;
}

export class EnquiryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EnquiryType }) @IsOptional() @IsEnum(EnquiryType) type?: EnquiryType;
  @ApiPropertyOptional({ enum: EnquiryStatus }) @IsOptional() @IsEnum(EnquiryStatus) status?: EnquiryStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) q?: string;
}

export class AdminEnquiryQueryDto extends EnquiryQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() dealerId?: string;
  @ApiPropertyOptional({ description: 'Only enquiries handled by the platform team (no dealer)' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  platformOnly?: boolean;
}

export class AdminUpdateEnquiryDto {
  @ApiPropertyOptional({ enum: EnquiryStatus }) @IsOptional() @IsEnum(EnquiryStatus) status?: EnquiryStatus;
  @ApiPropertyOptional({ description: 'Platform team member handling it' }) @IsOptional() @IsUUID() assignedAdminId?: string;
  @ApiPropertyOptional({ description: 'Route to a dealer (creates a lead for them)' }) @IsOptional() @IsUUID() dealerId?: string;
}
