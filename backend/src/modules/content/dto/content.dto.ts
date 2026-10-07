import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { ArticleType, ContentStatus, MediaType } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/**
 * Rich content is stored as structured blocks, never raw HTML, so the frontend renders it
 * without injecting markup (NFR-04 XSS). Shapes are validated in ContentService.
 *   { type: "paragraph", text } | { type: "heading", text, level? } | { type: "image", src, alt? }
 *   { type: "link", text, href } | { type: "list", items: string[] } | { type: "quote", text }
 *   { type: "video", url }
 */
export type ContentBlock = Record<string, unknown> & { type: string };

class SeoDto {
  @ApiPropertyOptional({ description: 'SEO meta title (NFR-12)' }) @IsOptional() @IsString() @MaxLength(70) metaTitle?: string;
  @ApiPropertyOptional({ description: 'SEO meta description' }) @IsOptional() @IsString() @MaxLength(170) metaDescription?: string;
}

export class ArticleDto extends SeoDto {
  @ApiProperty() @Transform(trim) @IsString() @Length(3, 200) title: string;
  @ApiPropertyOptional({ description: 'Defaults to a slug of the title' }) @IsOptional() @IsString() @MaxLength(160) slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) excerpt?: string;
  @ApiProperty({ type: 'array', items: { type: 'object' } }) @IsArray() @ArrayMaxSize(500) body: ContentBlock[];
  @ApiPropertyOptional({ enum: ArticleType }) @IsOptional() @IsEnum(ArticleType) type?: ArticleType;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_protocol: true }) coverImageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() featured?: boolean;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) tags?: string[];
}
export class UpdateArticleDto extends PartialType(ArticleDto) {}

export class PublishDto {
  @ApiProperty({ enum: ContentStatus }) @IsEnum(ContentStatus) status: ContentStatus;
  @ApiPropertyOptional({ description: 'Schedule: publish date (defaults to now)' }) @IsOptional() @IsDateString() publishedAt?: string;
}

export class ArticleQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) q?: string;
  @ApiPropertyOptional({ description: 'Category slug' }) @IsOptional() @IsString() @MaxLength(80) category?: string;
  @ApiPropertyOptional({ enum: ArticleType }) @IsOptional() @IsEnum(ArticleType) type?: ArticleType;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) tag?: string;
}

export class AdminArticleQueryDto extends ArticleQueryDto {
  @ApiPropertyOptional({ enum: ContentStatus }) @IsOptional() @IsEnum(ContentStatus) status?: ContentStatus;
}

export class ArticleCategoryDto {
  @ApiProperty() @Transform(trim) @IsString() @Length(2, 80) name: string;
}

export class MediaItemDto {
  @ApiProperty({ enum: MediaType }) @IsEnum(MediaType) type: MediaType;
  @ApiProperty() @Transform(trim) @IsString() @Length(3, 200) title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @ApiProperty({ description: 'Canonical URL (YouTube, Spotify, ...)' }) @IsUrl({ require_protocol: true, protocols: ['https'] }) url: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_protocol: true, protocols: ['https'] }) embedUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_protocol: true }) thumbnailUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) durationSec?: number;
}
export class UpdateMediaItemDto extends PartialType(MediaItemDto) {}

export class MediaQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MediaType }) @IsOptional() @IsEnum(MediaType) type?: MediaType;
}

export class FaqDto {
  @ApiProperty() @Transform(trim) @IsString() @Length(3, 300) question: string;
  @ApiProperty() @IsString() @Length(1, 5000) answer: string;
  @ApiPropertyOptional({ example: 'selling' }) @IsOptional() @IsString() @MaxLength(60) category?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateFaqDto extends PartialType(FaqDto) {}

export class StaticPageDto extends SeoDto {
  @ApiProperty({ example: 'privacy-policy' }) @IsString() @Length(2, 120) slug: string;
  @ApiProperty() @Transform(trim) @IsString() @Length(2, 200) title: string;
  @ApiProperty({ type: 'array', items: { type: 'object' } }) @IsArray() @ArrayMaxSize(500) body: ContentBlock[];
}
export class UpdateStaticPageDto extends PartialType(StaticPageDto) {}

export class PromotionDto {
  @ApiProperty() @Transform(trim) @IsString() @Length(3, 200) title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_protocol: true }) bannerUrl?: string;
  @ApiPropertyOptional({ enum: ['PERCENT', 'AMOUNT', 'NONE'] }) @IsOptional() @IsIn(['PERCENT', 'AMOUNT', 'NONE']) discountType?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) discountValue?: number;
  @ApiPropertyOptional({ description: 'Dealer-specific promotion' }) @IsOptional() @IsUUID() dealerId?: string;
  @ApiProperty() @IsDateString() startsAt: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdatePromotionDto extends PartialType(PromotionDto) {}

export class PromotionVehiclesDto {
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMaxSize(500) @IsUUID('all', { each: true }) vehicleIds: string[];
}
