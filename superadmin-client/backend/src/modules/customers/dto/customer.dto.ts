import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsUrl, MaxLength, IsOptional, IsString, Length, Matches, ValidateIf, ValidateNested } from 'class-validator';
import { PHONE_RULE } from '../../auth/dto/auth.dto';
import { SearchCriteriaDto } from '../../search/dto/search.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpdateProfileDto {
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @Transform(trim) @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048) youtubeProfileUrl?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @Transform(trim) @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048) facebookProfileUrl?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @Transform(trim) @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048) instagramProfileUrl?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @Transform(trim) @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048) linkedInProfileUrl?: string | null;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @Length(1, 80) firstName?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @Length(1, 80) lastName?: string;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @ValidateIf((_, value) => value !== null) @Matches(PHONE_RULE) phone?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() marketingConsent?: boolean;
}

export class CreateSavedSearchDto {
  @ApiProperty({ example: 'Diesel bakkies under R400k' }) @Transform(trim) @IsString() @Length(1, 120) name: string;
  @ApiProperty({ type: SearchCriteriaDto }) @ValidateNested() @Type(() => SearchCriteriaDto) criteria: SearchCriteriaDto;
  @ApiPropertyOptional({ default: true, description: 'Notify me about new matches and price drops (FR-39)' }) @IsOptional() @IsBoolean() alertsEnabled?: boolean;
}

export class UpdateSavedSearchDto {
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @Length(1, 120) name?: string;
  @ApiPropertyOptional({ type: SearchCriteriaDto }) @IsOptional() @ValidateNested() @Type(() => SearchCriteriaDto) criteria?: SearchCriteriaDto;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() alertsEnabled?: boolean;
}

export class DeleteAccountDto {
  @ApiProperty({ description: 'Current password, to confirm' }) @IsString() @Length(1, 128) password: string;
}
