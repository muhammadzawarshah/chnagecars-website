import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEmail, IsEnum, IsIn, IsOptional, IsString, IsUUID, Length, Matches, MaxLength, ValidateIf } from 'class-validator';
import { LeadActivityType, LeadSource, LeadStage } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { PHONE_RULE } from '../../auth/dto/auth.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateLeadDto {
  @ApiProperty() @Transform(trim) @IsString() @Length(1, 160) name: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @Matches(PHONE_RULE) phone?: string;
  @ApiProperty({ enum: [LeadSource.PHONE, LeadSource.WHATSAPP, LeadSource.EMAIL, LeadSource.WALK_IN, LeadSource.OTHER] })
  @IsIn([LeadSource.PHONE, LeadSource.WHATSAPP, LeadSource.EMAIL, LeadSource.WALK_IN, LeadSource.OTHER])
  source: LeadSource;
  @ApiPropertyOptional() @IsOptional() @IsUUID() vehicleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedToId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4000) note?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() nextFollowUpAt?: string;
}

export class UpdateLeadDto {
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @Length(1, 160) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @Matches(PHONE_RULE) phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() vehicleId?: string;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @ValidateIf((_, value) => value !== null) @IsDateString() nextFollowUpAt?: string | null;
}

export class ChangeStageDto {
  @ApiProperty({ enum: LeadStage }) @IsEnum(LeadStage) stage: LeadStage;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) note?: string;
  @ApiPropertyOptional({ description: 'Required when stage is LOST' }) @IsOptional() @IsString() @MaxLength(500) lostReason?: string;
}

export class AssignLeadDto {
  @ApiProperty({ nullable: true, description: 'Dealer member id, or null to unassign' })
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  memberId: string | null;
}

export class AddActivityDto {
  @ApiProperty({ enum: [LeadActivityType.NOTE, LeadActivityType.CALL, LeadActivityType.EMAIL, LeadActivityType.SMS, LeadActivityType.WHATSAPP, LeadActivityType.MEETING] })
  @IsIn([LeadActivityType.NOTE, LeadActivityType.CALL, LeadActivityType.EMAIL, LeadActivityType.SMS, LeadActivityType.WHATSAPP, LeadActivityType.MEETING])
  type: LeadActivityType;
  @ApiProperty() @IsString() @Length(1, 4000) note: string;
  @ApiPropertyOptional({ description: 'Schedule the next follow-up' }) @IsOptional() @IsDateString() nextFollowUpAt?: string;
}

export class LeadQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: LeadStage }) @IsOptional() @IsEnum(LeadStage) stage?: LeadStage;
  @ApiPropertyOptional({ description: '"me", "unassigned" or a member id' }) @IsOptional() @IsString() @MaxLength(40) assignedTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;
  @ApiPropertyOptional({ enum: LeadSource }) @IsOptional() @IsEnum(LeadSource) source?: LeadSource;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) q?: string;
  @ApiPropertyOptional({ description: 'Only leads with a follow-up due now or earlier' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  followUpDue?: boolean;
}
