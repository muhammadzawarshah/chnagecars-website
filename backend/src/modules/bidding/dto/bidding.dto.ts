import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BiddingStatus, OfferStatus, Province } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

/** FR-52: every rule of a bidding process is explicit and stored on the session. */
export class OpenBiddingDto {
  @ApiPropertyOptional({ description: 'Defaults to now. A future time schedules the session.' }) @IsOptional() @IsDateString() opensAt?: string;
  @ApiProperty({ description: 'When bidding closes (BR-07)' }) @IsDateString() closesAt: string;
  @ApiPropertyOptional({ default: true, description: 'Dealers may revise their bid (BR-08)' }) @IsOptional() @IsBoolean() allowBidModification?: boolean;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() allowBidWithdrawal?: boolean;
  @ApiPropertyOptional({ default: true, description: 'Customer may counter an offer (FR-56)' }) @IsOptional() @IsBoolean() allowCounterOffers?: boolean;
  @ApiPropertyOptional({ default: 48, description: 'Offer validity in hours (BR-10)' }) @IsOptional() @IsInt() @Min(1) @Max(720) offerValidityHours?: number;
  @ApiPropertyOptional({ description: 'Minimum acceptable bid (rand)' }) @IsOptional() @IsInt() @Min(0) reservePrice?: number;
  @ApiPropertyOptional({ enum: Province, isArray: true, description: 'Only dealers in these provinces (BR-06). Empty = all.' })
  @IsOptional()
  @IsArray()
  @IsEnum(Province, { each: true })
  eligibleProvinces?: Province[];
  @ApiPropertyOptional({ type: [String], description: 'Invite-only: only these dealers may view and bid' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('all', { each: true })
  inviteDealerIds?: string[];
}

export class SubmitOfferDto {
  @ApiProperty({ description: 'Offer in rand' }) @IsInt() @Min(1000) @Max(100_000_000) amount: number;
  @ApiPropertyOptional({ description: 'Additional terms shown to the customer' }) @IsOptional() @IsString() @MaxLength(2000) terms?: string;
  @ApiPropertyOptional({ description: 'Internal dealer notes (never shown to the customer)' }) @IsOptional() @IsString() @MaxLength(2000) dealerNotes?: string;
}

export class UpdateOfferDto extends SubmitOfferDto {
  @ApiPropertyOptional({ description: 'Optimistic concurrency: the offer version you last saw' }) @IsOptional() @IsInt() expectedVersion?: number;
}

export class CounterOfferDto {
  @ApiProperty() @IsInt() @Min(1000) @Max(100_000_000) amount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) message?: string;
}

export class CounterResponseDto {
  @ApiProperty({ description: 'true = accept the customer counter amount' }) @IsBoolean() accept: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) message?: string;
}

export class RejectOfferDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) reason?: string;
}

export class DealerSessionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: BiddingStatus }) @IsOptional() @IsEnum(BiddingStatus) status?: BiddingStatus;
}

export class DealerOfferQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OfferStatus }) @IsOptional() @IsEnum(OfferStatus) status?: OfferStatus;
}

export class ExtendOfferDto {
  @ApiProperty({ description: 'New expiry (BR-10 renewal/extension)' }) @IsDateString() expiresAt: string;
}

export class ReopenBiddingDto {
  @ApiProperty() @IsDateString() closesAt: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 500) reason?: string;
}
