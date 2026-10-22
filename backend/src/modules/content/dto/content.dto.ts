import { IsMarketplaceId, ParseMarketplaceIdPipe } from '../../../common/pipes/marketplace-id.pipe';
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
  Matches,
  MaxLength,
  Max,
  Min,
} from 'class-validator';
import { AdPlacement, ArticleType, ContentStatus, MediaType } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** An https URL or a path on the website (e.g. /images/specials/truck.jpg), like article cover images. */
const SITE_OR_HTTPS_URL = /^(https:\/\/|\/)[^\s<>"']*$/i;
const IsSiteOrHttpsUrl = (field: string) => Matches(SITE_OR_HTTPS_URL, { message: `${field} must be an https URL or a path on the website` });

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
  @ApiPropertyOptional({ description: 'https URL or a path on the website, e.g. /img/blog.jpg' }) @IsOptional() @Matches(/^(https:\/\/|\/)[^\s<>"']*$/i, { message: 'coverImageUrl must be an https URL or a path starting with /' }) @MaxLength(1000) coverImageUrl?: string;
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
  @ApiPropertyOptional({ description: 'https URL or a path on the website' }) @IsOptional() @IsSiteOrHttpsUrl('thumbnailUrl') @MaxLength(2000) thumbnailUrl?: string;
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
  @ApiPropertyOptional({ description: 'https URL or a path on the website' }) @IsOptional() @IsSiteOrHttpsUrl('bannerUrl') @MaxLength(2000) bannerUrl?: string;
  @ApiPropertyOptional({ enum: ['PERCENT', 'AMOUNT', 'NONE'] }) @IsOptional() @IsIn(['PERCENT', 'AMOUNT', 'NONE']) discountType?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) discountValue?: number;
  @ApiPropertyOptional({ description: 'Dealer-specific promotion' }) @IsOptional() @IsMarketplaceId() dealerId?: string;
  @ApiProperty() @IsDateString() startsAt: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdatePromotionDto extends PartialType(PromotionDto) {}

export class PromotionVehiclesDto {
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMaxSize(500) @IsMarketplaceId({ each: true }) vehicleIds: string[];
}

export class AdBannerDto {
  @ApiProperty({ description: 'Internal name, e.g. "Standard Bank vehicle finance"' }) @Transform(trim) @IsString() @Length(2, 120) title: string;
  @ApiProperty({ enum: AdPlacement }) @IsEnum(AdPlacement) placement: AdPlacement;
  @ApiProperty({ description: 'https URL or a path on the website' }) @IsSiteOrHttpsUrl('imageUrl') @MaxLength(2000) imageUrl: string;
  @ApiPropertyOptional({ description: 'Where a click goes' }) @IsOptional() @IsSiteOrHttpsUrl('linkUrl') @MaxLength(2000) linkUrl?: string;
  @ApiPropertyOptional({ description: 'Image description for screen readers' }) @IsOptional() @IsString() @MaxLength(200) altText?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional({ description: 'Shown from (empty: straight away)' }) @IsOptional() @IsDateString() startsAt?: string;
  @ApiPropertyOptional({ description: 'Shown until (empty: no end)' }) @IsOptional() @IsDateString() endsAt?: string;
}
export class UpdateAdBannerDto extends PartialType(AdBannerDto) {}

export class TestimonialDto {
  @ApiProperty() @Transform(trim) @IsString() @Length(2, 120) name: string;
  @ApiProperty() @Transform(trim) @IsString() @Length(10, 10000) text: string;
  @ApiPropertyOptional({ description: 'https URL or a path on the website' }) @IsOptional() @IsSiteOrHttpsUrl('photoUrl') @MaxLength(2000) photoUrl?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 5 }) @IsOptional() @IsInt() @Min(1) @Max(5) rating?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateTestimonialDto extends PartialType(TestimonialDto) {}

export class FeaturedDealerDto {
  @ApiProperty() @Transform(trim) @IsString() @Length(2, 160) name: string;
  @ApiPropertyOptional({ description: 'Page address /featured-dealer/<slug>; defaults to a slug of the name' }) @IsOptional() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug may use lowercase letters, numbers and dashes' }) @MaxLength(160) slug?: string;
  @ApiPropertyOptional({ description: 'https URL or a path on the website' }) @IsOptional() @IsSiteOrHttpsUrl('logoUrl') @MaxLength(2000) logoUrl?: string;
  @ApiPropertyOptional({ description: 'Short text on the home page card' }) @IsOptional() @IsString() @MaxLength(500) description?: string;
  @ApiPropertyOptional({ description: 'Page text; one paragraph per line' }) @IsOptional() @IsString() @MaxLength(20000) about?: string;
  @ApiPropertyOptional({ description: 'Marketplace dealer whose stock the page shows' }) @IsOptional() @IsMarketplaceId() dealerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateFeaturedDealerDto extends PartialType(FeaturedDealerDto) {}
