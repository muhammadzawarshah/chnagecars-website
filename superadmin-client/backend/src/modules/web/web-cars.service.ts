import { Injectable } from '@nestjs/common';
import { DealerStatus, ImageStatus, Prisma, VehicleCondition } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PUBLIC_DETAIL_STATUSES, PUBLIC_SEARCH_STATUSES } from '../vehicles/vehicle-lifecycle';
import { effectivePrice } from '../vehicles/vehicle.presenter';
import { PublicVehiclesService } from '../vehicles/public-vehicles.service';
import {
  BAKKIE_SLUGS,
  COLLECTION_CATEGORIES,
  FUEL_LABELS,
  PROVINCE_NAMES,
  TRANSMISSION_LABELS,
  bodyTypeLabel,
  bodyTypeSlugs,
  carCategory,
  driveLabel,
  drivetrainsFromLabel,
  engineLabel,
  filterValues,
  fromWebId,
  fuelsFromLabel,
  hoursRows,
  provinceFromName,
  slugify,
  toWebId,
  transmissionFromLabel,
  vehicleGroup,
  ymd,
} from './web-format';

/** Same page size as the website (app/lib/cars/search.ts PAGE_SIZE). */
export const WEB_PAGE_SIZE = 20;
/** Shown when a listing has no photo yet (an image in the website's public folder). */
const NO_IMAGE = '/img/success-car.png';
const MAX_ALL_CARS = 1000;
const MAX_LIMIT = 48;
/** Featured cars the random pick is drawn from. */
const MAX_FEATURED_POOL = 500;

/** Fisher–Yates shuffle into a new array. */
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const SORTS = ['recent', 'price-asc', 'price-desc', 'mileage-asc', 'mileage-desc', 'year-asc', 'year-desc'] as const;
type SortKey = (typeof SORTS)[number];
const COLLECTIONS = ['hot-sellers', 'student', 'bakkies', 'cheap', 'exotics', 'classics', 'leisure'] as const;
type Collection = (typeof COLLECTIONS)[number];

/** The website's CarSearch (app/lib/cars/search.ts), parsed from the query string. */
export interface WebCarSearch {
  q?: string;
  make?: string;
  model?: string;
  variant?: string;
  bodyType?: string;
  fuel?: string;
  transmission?: string;
  drive?: string;
  province?: string;
  colour?: string;
  collection?: Collection;
  vehicleGroup?: string;
  specials?: string;
  seats?: string;
  cylinders?: string;
  dealership?: string;
  minEngine?: number;
  maxEngine?: number;
  minKw?: number;
  maxKw?: number;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  sort?: SortKey;
  page?: number;
}

const TEXT_KEYS = ['q', 'make', 'model', 'variant', 'bodyType', 'fuel', 'transmission', 'drive', 'province', 'colour', 'collection', 'vehicleGroup', 'specials', 'seats', 'cylinders', 'dealership', 'sort'] as const;
const NUMBER_KEYS = ['minPrice', 'maxPrice', 'minYear', 'maxYear', 'minMileage', 'maxMileage', 'minEngine', 'maxEngine', 'minKw', 'maxKw', 'page'] as const;

/** Mirrors parseCarSearch on the website: unknown or malformed values are ignored, swapped ranges are fixed. */
export function parseWebCarSearch(query: Record<string, unknown>): WebCarSearch {
  const search: Record<string, string | number> = {};
  const read = (key: string) => {
    const value = query[key];
    const first = Array.isArray(value) ? value[0] : value;
    return typeof first === 'string' ? first : undefined;
  };
  for (const key of TEXT_KEYS) {
    const value = read(key)?.trim().slice(0, 500);
    if (value) search[key] = value;
  }
  for (const key of NUMBER_KEYS) {
    const value = Number(read(key));
    if (Number.isFinite(value) && value > 0) search[key] = Math.floor(value);
  }
  if (search.sort && !SORTS.includes(search.sort as SortKey)) delete search.sort;
  if (search.collection && !COLLECTIONS.includes(search.collection as Collection)) delete search.collection;
  for (const [min, max] of [['minPrice', 'maxPrice'], ['minYear', 'maxYear'], ['minMileage', 'maxMileage'], ['minEngine', 'maxEngine'], ['minKw', 'maxKw']] as const) {
    if (typeof search[min] === 'number' && typeof search[max] === 'number' && search[min] > search[max]) {
      [search[min], search[max]] = [search[max], search[min]];
    }
  }
  return search as WebCarSearch;
}

const carSelect = {
  id: true,
  title: true,
  year: true,
  price: true,
  specialPrice: true,
  isSpecial: true,
  isFeatured: true,
  condition: true,
  transmission: true,
  fuelType: true,
  drivetrain: true,
  colour: true,
  engineCapacityCc: true,
  powerKw: true,
  cylinders: true,
  seats: true,
  mileage: true,
  province: true,
  city: true,
  primaryImageUrl: true,
  imageCount: true,
  viewCount: true,
  enquiryCount: true,
  publishedAt: true,
  createdAt: true,
  make: { select: { name: true } },
  model: { select: { name: true } },
  variant: { select: { bodyCategory: { select: { slug: true } } } },
  categories: { select: { slug: true } },
  images: {
    where: { status: ImageStatus.READY },
    orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
    take: 24,
    select: { url: true, largeUrl: true, mediumUrl: true },
  },
  dealer: { select: { id: true, name: true, logoUrl: true, address: true } },
  branch: { select: { address: true, operatingHours: true } },
} satisfies Prisma.VehicleSelect;

type CarRow = Prisma.VehicleGetPayload<{ select: typeof carSelect }>;

export type WebCar = ReturnType<typeof toWebCar>;

/** One database row → the website's Car (app/lib/cars/types.ts). */
export function toWebCar(row: CarRow) {
  const slugs = row.categories.map((category) => category.slug);
  if (row.variant?.bodyCategory) slugs.push(row.variant.bodyCategory.slug);
  const gallery = row.images.map((image) => image.largeUrl ?? image.url ?? image.mediumUrl).filter((url): url is string => !!url);
  const image = row.primaryImageUrl ?? gallery[0] ?? NO_IMAGE;
  const province = PROVINCE_NAMES[row.province];
  const effPrice = effectivePrice(row);
  const r = 0.125 / 12;
  const monthly = effPrice <= 0 ? 0 : Math.round((effPrice * r) / (1 - Math.pow(1 + r, -72)));
  return {
    id: toWebId(row.id),
    title: row.title,
    make: row.make.name,
    model: row.model.name,
    year: row.year ?? 0,
    price: effPrice,
    monthlyPrice: monthly,
    formattedMonthlyPrice: `R ${monthly.toLocaleString('en-US').replace(/,/g, ' ')} pm`,
    bodyType: bodyTypeLabel(slugs),
    fuel: FUEL_LABELS[row.fuelType],
    transmission: TRANSMISSION_LABELS[row.transmission],
    drive: driveLabel(row.drivetrain),
    colour: row.colour ?? '',
    engine: engineLabel(row.engineCapacityCc),
    mileage: row.mileage ?? -1,
    image,
    gallery: gallery.length ? gallery : [image],
    photoCount: Math.max(row.imageCount, gallery.length),
    dealer: {
      id: row.dealer.id,
      name: row.dealer.name,
      logo: row.dealer.logoUrl ?? undefined,
      address: row.branch?.address ?? row.dealer.address ?? undefined,
      hours: hoursRows(row.branch?.operatingHours),
    },
    location: `${row.city}, ${province}`,
    province,
    category: carCategory(slugs),
    vehicleGroup: vehicleGroup(row.condition, slugs),
    isSpecial: row.isSpecial,
    engineCc: row.engineCapacityCc ?? undefined,
    powerKw: row.powerKw ?? undefined,
    seats: row.seats ?? undefined,
    cylinders: row.cylinders ?? undefined,
    featured: row.isFeatured,
    listedAt: ymd(row.publishedAt ?? row.createdAt),
    views: row.viewCount,
    enquiries: row.enquiryCount,
  };
}

const ORDER: Record<SortKey, Prisma.VehicleOrderByWithRelationInput[]> = {
  recent: [{ publishedAt: 'desc' }, { id: 'desc' }],
  'price-asc': [{ price: 'asc' }, { id: 'asc' }],
  'price-desc': [{ price: 'desc' }, { id: 'desc' }],
  'mileage-asc': [{ mileage: 'asc' }, { id: 'asc' }],
  // Unknown mileage/year go last, not first (PostgreSQL puts NULLs first when descending).
  'mileage-desc': [{ mileage: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }],
  'year-asc': [{ year: 'asc' }, { id: 'asc' }],
  'year-desc': [{ year: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }],
};

const CYLINDER_RANGES: Record<string, [number, number]> = { '1-2': [1, 2], '3-5': [3, 5], '6-8': [6, 8], '10-12': [10, 12] };

const clampLimit = (limit: number | undefined, fallback: number) => Math.min(Math.max(Math.floor(limit ?? fallback) || fallback, 1), MAX_LIMIT);

/** "glc" matches the "glc-class" model and the other way round, like the website's matcher. */
const modelSlugs = (slug: string) => {
  const base = slug.replace(/-class$/, '');
  return [...new Set([slug, base, `${base}-class`])];
};

@Injectable()
export class WebCarsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicVehicles: PublicVehiclesService,
  ) {}

  private get db() {
    return this.prisma.replica;
  }

  /** Listings the public may browse: published or reserved, from an approved dealer. */
  private publicWhere(extra: Prisma.VehicleWhereInput = {}): Prisma.VehicleWhereInput {
    return { status: { in: PUBLIC_SEARCH_STATUSES }, dealer: { status: DealerStatus.APPROVED }, ...extra };
  }

  async search(search: WebCarSearch) {
    const where = this.publicWhere({ AND: this.filters(search) });
    const total = await this.db.vehicle.count({ where });
    const pageCount = Math.max(1, Math.ceil(total / WEB_PAGE_SIZE));
    const page = Math.min(search.page ?? 1, pageCount);
    const rows = await this.db.vehicle.findMany({
      where,
      select: carSelect,
      orderBy: ORDER[search.sort ?? 'recent'],
      skip: (page - 1) * WEB_PAGE_SIZE,
      take: WEB_PAGE_SIZE,
    });
    return { cars: rows.map(toWebCar), total, page, pageCount };
  }

  async count(search: WebCarSearch) {
    const where = this.publicWhere({ AND: this.filters(search) });
    const total = await this.db.vehicle.count({ where });
    return {
      total,
      count: total,
      formatted: total.toLocaleString('en-US').replace(/,/g, ' '),
    };
  }

  async all(limit = MAX_ALL_CARS) {
    const rows = await this.db.vehicle.findMany({ where: this.publicWhere(), select: carSelect, orderBy: ORDER.recent, take: Math.min(Math.max(limit, 1), MAX_ALL_CARS) });
    return rows.map(toWebCar);
  }

  /** A fresh random pick and order on every call, so each hit shows the featured cars shuffled. */
  async featured(limit?: number) {
    const candidates = await this.db.vehicle.findMany({ where: this.publicWhere({ isFeatured: true }), select: { id: true }, take: MAX_FEATURED_POOL });
    const ids = shuffle(candidates.map((candidate) => candidate.id)).slice(0, clampLimit(limit, 6));
    const rows = await this.db.vehicle.findMany({ where: { id: { in: ids } }, select: carSelect });
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids.flatMap((id) => (byId.has(id) ? [toWebCar(byId.get(id)!)] : []));
  }

  async recent(limit?: number) {
    const rows = await this.db.vehicle.findMany({ where: this.publicWhere(), select: carSelect, orderBy: ORDER.recent, take: clampLimit(limit, 6) });
    return rows.map(toWebCar);
  }

  /** Detail page: sold cars stay reachable (marked by the website as sold) and the view is counted. */
  async get(webId: string, viewerId?: string) {
    const row = await this.findRow(webId, PUBLIC_DETAIL_STATUSES);
    if (!row) return null;
    const detail = await this.publicVehicles.detail(row.id, viewerId);
    const ids = [...new Set([...detail.moreFromThisDealer, ...detail.youMightLike].map((car) => car.id))];
    const relatedRows = ids.length ? await this.db.vehicle.findMany({
      where: this.publicWhere({ id: { in: ids } }),
      select: carSelect,
    }) : [];
    const cards = new Map(relatedRows.map((car) => [car.id, toWebCar(car)]));
    const section = (items: { id: string }[]) => items.flatMap((car) => {
      const card = cards.get(car.id);
      return card ? [card] : [];
    });
    return {
      ...toWebCar(row),
      description: detail.description,
      additionalInformation: detail.additionalInformation,
      mapDetails: detail.mapDetails,
      moreFromThisDealer: section(detail.moreFromThisDealer),
      youMightLike: section(detail.youMightLike),
    };
  }

  async dealerCars(webId: string, limit?: number) {
    const base = await this.findRow(webId, PUBLIC_DETAIL_STATUSES);
    if (!base) return [];
    const rows = await this.db.vehicle.findMany({
      where: this.publicWhere({ dealerId: base.dealer.id, id: { not: base.id } }),
      select: carSelect,
      orderBy: ORDER.recent,
      take: clampLimit(limit, 6),
    });
    return rows.map(toWebCar);
  }

  /** Same body type first, then everything else (as the website's mock did). */
  async similar(webId: string, limit?: number) {
    const base = await this.findRow(webId, PUBLIC_DETAIL_STATUSES);
    if (!base) return [];
    const take = clampLimit(limit, 6);
    const bodySlugs = bodyTypeSlugs(toWebCar(base).bodyType);
    const sameType = bodySlugs.length
      ? await this.db.vehicle.findMany({
          where: this.publicWhere({ id: { not: base.id }, categories: { some: { slug: { in: bodySlugs } } } }),
          select: carSelect,
          orderBy: [{ popularityScore: 'desc' }, { publishedAt: 'desc' }],
          take,
        })
      : [];
    const others =
      sameType.length < take
        ? await this.db.vehicle.findMany({
            where: this.publicWhere({ id: { notIn: [base.id, ...sameType.map((row) => row.id)] } }),
            select: carSelect,
            orderBy: ORDER.recent,
            take: take - sameType.length,
          })
        : [];
    return [...sameType, ...others].map(toWebCar);
  }

  /** Dealers with the most stock of the same make and model. */
  async popularDealers(webId: string, limit?: number) {
    const base = await this.findRow(webId, PUBLIC_DETAIL_STATUSES, { makeId: true, modelId: true });
    if (!base) return [];
    const groups = await this.db.vehicle.groupBy({
      by: ['dealerId'],
      where: this.publicWhere({ makeId: base.makeId, modelId: base.modelId }),
      _count: { _all: true },
      orderBy: { _count: { dealerId: 'desc' } },
      take: Math.min(clampLimit(limit, 3), 12),
    });
    if (!groups.length) return [];
    const dealers = await this.db.dealer.findMany({
      where: { id: { in: groups.map((group) => group.dealerId) } },
      select: { id: true, name: true, logoUrl: true, address: true, branches: { where: { isHeadOffice: true }, take: 1, select: { operatingHours: true } } },
    });
    return groups.flatMap((group) => {
      const dealer = dealers.find((item) => item.id === group.dealerId);
      if (!dealer) return [];
      return [{ dealer: { id: dealer.id, name: dealer.name, logo: dealer.logoUrl ?? undefined, address: dealer.address, hours: hoursRows(dealer.branches[0]?.operatingHours) }, count: group._count._all }];
    });
  }

  /** Average asking price of the same make and model (excluding this car), or null. */
  async marketPrice(webId: string) {
    const base = await this.findRow(webId, PUBLIC_DETAIL_STATUSES, { makeId: true, modelId: true });
    if (!base) return { price: null };
    const result = await this.db.vehicle.aggregate({
      where: this.publicWhere({ makeId: base.makeId, modelId: base.modelId, id: { not: base.id } }),
      _avg: { price: true },
      _count: { _all: true },
    });
    return { price: result._count._all ? Math.round(result._avg.price ?? 0) : null };
  }

  private async findRow(webId: string, statuses: typeof PUBLIC_DETAIL_STATUSES, extra?: { makeId: true; modelId: true }) {
    const id = fromWebId(webId);
    if (!id) return null;
    const row = await this.db.vehicle.findFirst({
      where: { id, status: { in: statuses }, dealer: { status: DealerStatus.APPROVED } },
      select: { ...carSelect, ...(extra ?? {}), makeId: true, modelId: true },
    });
    return row;
  }

  // ───────────── filters ─────────────

  private filters(search: WebCarSearch): Prisma.VehicleWhereInput[] {
    const and: Prisma.VehicleWhereInput[] = [];
    const anyOf = (conditions: Prisma.VehicleWhereInput[]) => {
      // A filter whose values are all unknown matches nothing, like the website's matcher.
      and.push(conditions.length ? { OR: conditions } : { id: { in: [] } });
    };

    if (search.q) {
      for (const word of search.q.split(/\s+/).filter(Boolean).slice(0, 8)) and.push({ title: { contains: word, mode: 'insensitive' } });
    }
    if (search.make) anyOf([{ make: { slug: { in: filterValues(search.make).map(slugify) } } }]);
    if (search.model) {
      anyOf(
        filterValues(search.model).map((value) => {
          const parts = value.split(':');
          const model = slugify(parts.pop()!);
          const make = parts.length ? slugify(parts[0]) : undefined;
          return { ...(make ? { make: { slug: make } } : {}), model: { slug: { in: modelSlugs(model) } } };
        }),
      );
    }
    if (search.variant) {
      anyOf(
        filterValues(search.variant).map((value) => {
          const parts = value.split(':');
          const variant = parts.length > 2 ? parts[parts.length - 1] : parts.length === 1 ? value : parts[parts.length - 1];
          const make = parts.length > 1 ? slugify(parts[0]) : undefined;
          const words = slugify(variant).split('-').filter(Boolean);
          return {
            ...(make ? { make: { slug: make } } : {}),
            OR: [{ variant: { slug: { startsWith: slugify(variant) } } }, { AND: words.map((word) => ({ title: { contains: word, mode: 'insensitive' as const } })) }],
          };
        }),
      );
    }
    if (search.bodyType) {
      const slugs = filterValues(search.bodyType).flatMap(bodyTypeSlugs);
      anyOf(slugs.length ? [{ categories: { some: { slug: { in: slugs } } } }] : []);
    }
    if (search.fuel) {
      const fuels = filterValues(search.fuel).flatMap(fuelsFromLabel);
      anyOf(fuels.length ? [{ fuelType: { in: fuels } }] : []);
    }
    if (search.transmission) {
      const values = filterValues(search.transmission).map(transmissionFromLabel).filter((value) => value !== undefined);
      anyOf(values.length ? [{ transmission: { in: values } }] : []);
    }
    if (search.drive) {
      const values = filterValues(search.drive).flatMap(drivetrainsFromLabel);
      anyOf(values.length ? [{ drivetrain: { in: values } }] : []);
    }
    if (search.province) {
      const values = filterValues(search.province).map(provinceFromName).filter((value) => value !== undefined);
      anyOf(values.length ? [{ province: { in: values } }] : []);
    }
    if (search.colour) anyOf(filterValues(search.colour).map((colour) => ({ colour: { contains: colour, mode: 'insensitive' as const } })));
    if (search.collection) and.push(this.collection(search.collection));
    if (search.vehicleGroup) {
      anyOf(
        filterValues(search.vehicleGroup).flatMap((group): Prisma.VehicleWhereInput[] => {
          switch (slugify(group)) {
            case 'new':
              return [{ condition: VehicleCondition.NEW }];
            case 'almost-new':
              return [{ condition: VehicleCondition.DEMO }];
            case 'used':
              return [{ condition: VehicleCondition.USED, categories: { none: { slug: COLLECTION_CATEGORIES.classic } } }];
            case 'classic':
              return [{ categories: { some: { slug: COLLECTION_CATEGORIES.classic } } }];
            default:
              return [];
          }
        }),
      );
    }
    if (search.specials) {
      const values = new Set(filterValues(search.specials).map(slugify));
      const on = values.has('on-special');
      const off = values.has('not-on-special');
      if (on !== off) and.push({ isSpecial: on });
      else if (!on && !off) and.push({ id: { in: [] } });
    }
    if (search.minEngine) and.push({ engineCapacityCc: { gte: search.minEngine } });
    if (search.maxEngine) and.push({ engineCapacityCc: { lte: search.maxEngine } });
    if (search.minKw) and.push({ powerKw: { gte: search.minKw } });
    if (search.maxKw) and.push({ powerKw: { lte: search.maxKw } });
    if (search.seats) {
      anyOf(
        filterValues(search.seats).flatMap((value): Prisma.VehicleWhereInput[] => {
          if (value === '8+') return [{ seats: { gte: 8 } }];
          const seats = Number(value);
          return Number.isInteger(seats) && seats > 0 ? [{ seats }] : [];
        }),
      );
    }
    if (search.cylinders) {
      anyOf(filterValues(search.cylinders).flatMap((value) => (CYLINDER_RANGES[value] ? [{ cylinders: { gte: CYLINDER_RANGES[value][0], lte: CYLINDER_RANGES[value][1] } }] : [])));
    }
    if (search.dealership) {
      anyOf(filterValues(search.dealership).map((name) => ({ dealer: { OR: [{ slug: slugify(name) }, { name: { equals: name, mode: 'insensitive' as const } }] } })));
    }
    if (search.minPrice) and.push({ price: { gte: search.minPrice } });
    if (search.maxPrice) and.push({ price: { lte: search.maxPrice } });
    if (search.minYear) and.push({ year: { gte: search.minYear } });
    if (search.maxYear) and.push({ year: { lte: search.maxYear } });
    if (search.minMileage) and.push({ mileage: { gte: search.minMileage } });
    if (search.maxMileage) and.push({ mileage: { lte: search.maxMileage } });
    return and;
  }

  /** The website's curated lists, now owned by the backend. */
  private collection(collection: Collection): Prisma.VehicleWhereInput {
    switch (collection) {
      case 'hot-sellers':
        return { isFeatured: true };
      case 'student':
        return { price: { lte: 200_000 } };
      case 'cheap':
        return { price: { lte: 150_000 } };
      case 'bakkies':
        return { categories: { some: { slug: { in: BAKKIE_SLUGS } } } };
      case 'exotics':
        return { categories: { some: { slug: COLLECTION_CATEGORIES.exotic } } };
      case 'classics':
        return { categories: { some: { slug: COLLECTION_CATEGORIES.classic } } };
      case 'leisure':
        return { categories: { some: { slug: COLLECTION_CATEGORIES.leisure } } };
    }
  }
}
