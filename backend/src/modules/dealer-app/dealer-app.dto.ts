import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export const DEALER_APP_SCOPES = ['dealer:read', 'dealer:write', 'vehicles:read', 'vehicles:write'] as const;
export type DealerAppScope = (typeof DEALER_APP_SCOPES)[number];

export class CreateDealerAppTokenDto {
  @ApiProperty({ example: 'Dealer mobile app' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(2, 100)
  appName: string;

  @ApiPropertyOptional({ enum: DEALER_APP_SCOPES, isArray: true, default: ['dealer:read', 'vehicles:read'] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsIn(DEALER_APP_SCOPES, { each: true })
  scopes?: DealerAppScope[];

  @ApiPropertyOptional({ default: 90, minimum: 1, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiresInDays?: number;
}
