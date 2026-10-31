import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsIn, IsUUID, MaxLength, MinLength, Matches, IsArray, IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { NotificationChannel } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class NotificationListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  unreadOnly?: boolean;
}

export class NotificationPreferenceItemDto {
  @ApiProperty({ example: 'offer.new' })
  @IsString()
  eventType: string;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}

export class UpdateNotificationPreferencesDto {
  @ApiProperty({ type: [NotificationPreferenceItemDto] })
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => NotificationPreferenceItemDto)
  items: NotificationPreferenceItemDto[];
}

export class PushDeviceDto {
  @IsString() @MinLength(20) @MaxLength(4096) @Matches(/^\S+$/)
  token: string;

  @IsIn(['android', 'ios'])
  platform: string;
}

export class RemovePushDeviceDto {
  @IsString() @MinLength(20) @MaxLength(4096)
  token: string;
}

export class BroadcastNotificationDto {
  @IsOptional() @IsString() @Matches(/^[a-z0-9][a-z0-9-]{2,63}$/)
  appId?: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @MinLength(1) @MaxLength(120)
  title: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @MinLength(1) @MaxLength(1000)
  body: string;

  @IsIn(['all', 'customers', 'dealers', 'selected'])
  audience: string;

  @IsOptional() @IsArray() @ArrayNotEmpty() @ArrayMaxSize(500) @IsUUID('all', { each: true })
  userIds?: string[];
}
