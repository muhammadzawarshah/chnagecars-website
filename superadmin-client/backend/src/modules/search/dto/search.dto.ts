import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

const toBool = ({ value }: { value: unknown }) => (value === undefined ? undefined : value === true || value === 'true' || value === '1');

export const SORT_KEYS = [
  'recent',
  'oldest',
  'price-asc',
  'price-desc',
  'mileage-asc',
  'mileage-desc',
  'year-desc',
  'year-asc',
  'popular',
  'nearest',
] as const;
export type SortKey = (typeof SORT_KEYS)[number];

/** Curated lists (FR-23 specials, FR-24 hot sellers, plus marketing collections). */
export const COLLECTIONS = ['hot-sellers', 'specials', 'featured', 'new-arrivals', 'budget', 'student', 'bakkies', 'electric'] as const;
export type Collection = (typeof COLLECTIONS)[number];

/**
 * Every public search filter (FR-02, FR-05, FR-06, FR-07, FR-27). Multi-value filters are
 * comma-separated slugs/enums, e.g. make=bmw,audi&fuelType=PETROL,DIESEL.
 * Saved searches (FR-38) store exactly these fields.
 */
export class SearchCriteriaDto {
  @ApiPropertyOptional({ description: 'Free text over the listing title' }) @IsOptional() @IsString() @MaxLength(100) q?: string;
  @ApiPropertyOptional({ description: 'Make slugs, comma-separated', example: 'bmw,audi' }) @IsOptional() @IsString() @MaxLength(500) make?: string;
  @ApiPropertyOptional({ description: 'Model slugs; scope to a make with make:model', example: 'bmw:3-series' }) @IsOptional() @IsString() @MaxLength(500) model?: string;
  @ApiPropertyOptional({ description: 'Variant slugs', example: '320i-m-sport-2022' }) @IsOptional() @IsString() @MaxLength(500) variant?: string;
  @ApiPropertyOptional({ description: 'NEW, USED, DEMO', example: 'USED' }) @IsOptional() @IsString() @MaxLength(50) condition?: string;
  @ApiPropertyOptional({ description: 'Category slugs (FR-25)', example: 'suvs,bakkies' }) @IsOptional() @IsString() @MaxLength(300) category?: string;
  @ApiPropertyOptional({ example: 'PETROL,DIESEL' }) @IsOptional() @IsString() @MaxLength(200) fuelType?: string;
  @ApiPropertyOptional({ example: 'AUTOMATIC' }) @IsOptional() @IsString() @MaxLength(50) transmission?: string;
  @ApiPropertyOptional({ example: 'FOUR_X_FOUR' }) @IsOptional() @IsString() @MaxLength(100) drivetrain?: string;
  @ApiPropertyOptional({ description: 'Provinces (FR-27)', example: 'GAUTENG,WESTERN_CAPE' }) @IsOptional() @IsString() @MaxLength(300) province?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) city?: string;
  @ApiPropertyOptional({ example: 'White,Black' }) @IsOptional() @IsString() @MaxLength(200) colour?: string;
  @ApiPropertyOptional({ description: 'Dealer slug' }) @IsOptional() @IsString() @MaxLength(120) dealer?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) minPrice?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxPrice?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1900) minYear?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Max(2100) maxYear?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) minMileage?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxMileage?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) minEngineCc?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxEngineCc?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) minPowerKw?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxPowerKw?: number;
  @ApiPropertyOptional({ description: 'Seat counts, comma-separated; "8+" for eight or more', example: '5,7' }) @IsOptional() @IsString() @MaxLength(50) seats?: string;

  @ApiPropertyOptional({ description: 'Only vehicles on special (FR-23)' }) @IsOptional() @Transform(toBool) @IsBoolean() onSpecial?: boolean;
  @ApiPropertyOptional() @IsOptional() @Transform(toBool) @IsBoolean() featured?: boolean;
  @ApiPropertyOptional({ description: 'Hide reserved vehicles' }) @IsOptional() @Transform(toBool) @IsBoolean() availableOnly?: boolean;
  @ApiPropertyOptional({ enum: COLLECTIONS }) @IsOptional() @IsIn(COLLECTIONS) collection?: Collection;

  @ApiPropertyOptional({ description: 'Centre latitude for radius search' }) @IsOptional() @Type(() => Number) @IsLatitude() lat?: number;
  @ApiPropertyOptional({ description: 'Centre longitude for radius search' }) @IsOptional() @Type(() => Number) @IsLongitude() lng?: number;
  @ApiPropertyOptional({ description: 'Radius in km (with lat/lng)' }) @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(1000) radiusKm?: number;
}

export class SearchVehiclesQueryDto extends SearchCriteriaDto {
  @ApiPropertyOptional({ enum: SORT_KEYS, default: 'recent', description: 'nearest needs lat and lng' }) @IsOptional() @IsIn(SORT_KEYS) sort?: SortKey;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) page?: number;
  @ApiPropertyOptional({ default: 20, maximum: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize?: number;
}

/** Fields that define a search (no paging/sorting) — what a saved search persists. */
export const CRITERIA_KEYS = [
  'q', 'make', 'model', 'variant', 'condition', 'category', 'fuelType', 'transmission', 'drivetrain', 'province', 'city', 'colour',
  'dealer', 'branchId', 'minPrice', 'maxPrice', 'minYear', 'maxYear', 'minMileage', 'maxMileage', 'minEngineCc', 'maxEngineCc',
  'minPowerKw', 'maxPowerKw', 'seats', 'onSpecial', 'featured', 'availableOnly', 'collection', 'lat', 'lng', 'radiusKm',
] as const satisfies readonly (keyof SearchCriteriaDto)[];

export function pickCriteria(source: SearchCriteriaDto): SearchCriteriaDto {
  const criteria: Record<string, unknown> = {};
  for (const key of CRITERIA_KEYS) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') criteria[key] = value;
  }
  return criteria as SearchCriteriaDto;
}
