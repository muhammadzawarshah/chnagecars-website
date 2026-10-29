import { titleCase } from '../../common/utils/display-text';
import { standardColourId } from './standard-colours';
import { resolveBodyType } from './body-type-mapping';
import { ImageStatus, Prisma, VehicleStatus } from '../../generated/prisma/client';
import { availabilityOf } from './vehicle-lifecycle';
import { vehicleLabel, withVehicleLabels } from './vehicle-labels';

/** Columns safe to expose publicly. VIN, registration, review notes and internal ids are excluded (NFR-17). */
export const publicVehicleSelect = {
  id: true,
  slug: true,
  stockNumber: true,
  sourceData: true,
  description: true,
  title: true,
  condition: true,
  status: true,
  year: true,
  mileage: true,
  price: true,
  specialPrice: true,
  isSpecial: true,
  isFeatured: true,
  transmission: true,
  fuelType: true,
  drivetrain: true,
  colour: true,
  engineCapacityCc: true,
  powerKw: true,
  cylinders: true,
  seats: true,
  doors: true,
  province: true,
  city: true,
  primaryImageUrl: true,
  imageCount: true,
  viewCount: true,
  publishedAt: true,
  reservedUntil: true,
  make: { select: { id: true, name: true, slug: true } },
  model: { select: { id: true, name: true, slug: true } },
  variant: { select: { id: true, name: true, slug: true, specification: true } },
  dealer: { select: { id: true, name: true, slug: true, logoUrl: true, rating: true, plan: true } },
  branch: { select: { id: true, name: true, city: true, province: true } },
  categories: { select: { id: true, slug: true, name: true } },
  promotion: { select: { id: true, title: true, slug: true, endsAt: true } },
} satisfies Prisma.VehicleSelect;

export const publicVehicleDetailSelect = {
  ...publicVehicleSelect,
  description: true,
  latitude: true,
  longitude: true,
  makeId: true,
  modelId: true,
  generationId: true,
  variantId: true,
  dealerId: true,
  generation: { select: { id: true, name: true, yearFrom: true, yearTo: true } },
  variant: { select: { id: true, name: true, slug: true, specification: true } },
  dealer: {
    select: { id: true, name: true, slug: true, logoUrl: true, rating: true, plan: true, phone: true, email: true, website: true, address: true, city: true, province: true },
  },
  branch: {
    select: { id: true, name: true, address: true, city: true, province: true, phone: true, email: true, latitude: true, longitude: true, operatingHours: true },
  },
  images: {
    where: { status: ImageStatus.READY },
    orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
    select: { id: true, url: true, thumbnailUrl: true, mediumUrl: true, largeUrl: true, width: true, height: true, altText: true, isPrimary: true },
  },
} satisfies Prisma.VehicleSelect;

export type PublicVehicleRow = Prisma.VehicleGetPayload<{ select: typeof publicVehicleSelect }>;

/** Effective price customers pay: the special price when on special. */
export function effectivePrice(vehicle: { price: number; specialPrice: number | null; isSpecial: boolean }): number {
  return vehicle.isSpecial && vehicle.specialPrice ? vehicle.specialPrice : vehicle.price;
}

/** Standard monthly installment calculation (72 months, 12.5% annual rate, 0 deposit). */
export function monthlyPayment(principal: number, months = 72, rate = 0.125): number {
  const r = rate / 12;
  return principal <= 0 ? 0 : Math.round((principal * r) / (1 - Math.pow(1 + r, -months)));
}

export function withAvailability<T extends { status: VehicleStatus; price: number; specialPrice: number | null; isSpecial: boolean }>(vehicle: T) {
  const { sourceData, ...safeVehicle } = vehicle as T & { sourceData?: unknown };
  const fields = publicVehicleFields(vehicle);
  const effPrice = effectivePrice(vehicle);
  const monthly = monthlyPayment(effPrice);
  return {
    ...withVehicleLabels(safeVehicle),
    ...((object(sourceData).importPolicy === 'dealertrade-only' && 'variant' in safeVehicle && safeVehicle.variant) ? { variant: { ...object(safeVehicle.variant), specification: null } } : {}),
    ...fields,
    colourId: standardColourId((vehicle as T & { colour?: string }).colour),
    conditionLabel: vehicleLabel('condition', (vehicle as T & { condition?: string }).condition) ?? '',
    fuelTypeLabel: vehicleLabel('fuelType', (vehicle as T & { fuelType?: string }).fuelType) ?? '',
    transmissionLabel: vehicleLabel('transmission', (vehicle as T & { transmission?: string }).transmission) ?? '',
    ...('dealer' in safeVehicle && safeVehicle.dealer && typeof safeVehicle.dealer === 'object' ? {
      dealer: { ...safeVehicle.dealer, whatsappNumber: dealerWhatsappNumber(object(sourceData).dealertradeDealer) },
    } : {}),
    availability: availabilityOf(vehicle.status),
    effectivePrice: effPrice,
    monthlyPrice: monthly,
    formattedMonthlyPrice: `R ${monthly.toLocaleString('en-US').replace(/,/g, ' ')} pm`,
    discount: vehicle.isSpecial && vehicle.specialPrice && vehicle.specialPrice < vehicle.price ? vehicle.price - vehicle.specialPrice : null,
  };
}

export function dealerWhatsappNumber(source: unknown): string | null {
  return text(object(source).whatsapp_number);
}

/** Only explicitly allowed source fields may leave the API; raw feeds contain private data. */
function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function text(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const result = String(value).trim();
  return result && !/^(n\/a|null|none)$/i.test(result) ? result : null;
}
function positive(value: unknown): number | null {
  const result = text(value);
  return result !== null && Number.isFinite(Number(result)) && Number(result) > 0 ? Number(result) : null;
}
export function vehicleSourceLinks(source: unknown) {
  const feed = object(object(source).dealertrade);
  const raw = text(feed.single_vehicle_url);
  if (!raw) return { singleVehicleUrl: null, sourceUrl: null };
  try {
    const url = new URL(raw, 'https://www.changecars.co.za/');
    const sourceId = text(feed.vehicle_id);
    if (url.protocol !== 'https:' || url.hostname !== 'www.changecars.co.za' || url.username || url.password || url.port ||
        !/^\/new-or-used-(?:cars|motorbikes|caravans|boats)-for-sale\//.test(url.pathname) ||
        (sourceId && url.pathname.replace(/\/$/, '').split('/').at(-1) !== sourceId)) {
      return { singleVehicleUrl: null, sourceUrl: null };
    }
    return { singleVehicleUrl: raw, sourceUrl: url.href };
  } catch { return { singleVehicleUrl: null, sourceUrl: null }; }
}

function publicVideoUrl(value: unknown): string | null {
  try {
    const url = new URL(text(value) ?? '');
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
function sourceFlag(value: unknown): boolean | null {
  if (value === 1 || value === '1' || value === true) return true;
  if (value === 0 || value === '0' || value === false) return false;
  return null;
}

export function publicVehicleFields(vehicle: unknown) {
  const row = object(vehicle), source = object(row.sourceData);
  const feed = object(source.dealertrade);
  const spec = source.importPolicy === 'dealertrade-only' ? {} : object(object(row.variant).specification), extra = object(spec.extra);
  const turbo = text(feed.turbo_supercharged)?.toUpperCase();
  const bodyType = resolveBodyType(feed)?.label ?? null;
  return {
    ...vehicleSourceLinks(row.sourceData),
    videoUrl: publicVideoUrl(feed.video_url),
    priceOnApplication: sourceFlag(feed.poa),
    extras: text(feed.extras) ? titleCase(text(feed.extras)!) : null,
    comment: text(feed.comment) ? titleCase(text(feed.comment)!) : null,
    sourceCreatedAt: text(feed.created_at),
    sourceUpdatedAt: text(feed.updated_at),
    technicalSpecifications: {
      doors: positive(feed.no_doors) ?? positive(row.doors),
      seats: positive(feed.no_seats) ?? positive(row.seats),
      bodyType,
      colour: text(row.colour),
      introductionDate: text(feed.introduction_date),
      powerKw: positive(feed.kilowatts) ?? positive(row.powerKw),
      cylinders: positive(feed.cylinders) ?? positive(row.cylinders),
      engineCapacityCc: positive(feed.engine_capacity) ?? positive(row.engineCapacityCc),
      turboSupercharged: turbo === 'T' || turbo === 'S' || turbo === 'N' ? turbo : turbo === 'NO' ? 'N' : null,
      fuelTankLitres: positive(feed.fuel_tank_size) ?? positive(spec.fuelTankLitres),
      frontTyreSize: text(feed.front_tyre_size),
      rearTyreSize: text(feed.rear_tyre_size),
      drivenWheels: text(feed.driven_wheels) ?? ({ '4x2': '4X2', '4x4': '4X4', FWD: 'FWD', RWD: 'RWD', AWD: 'AWD' }[String(row.drivetrain)] ?? null),
    },
    gears: positive(feed.no_gears) ?? positive(spec.gears),
    turboSupercharged: turbo === 'T' ? 'TURBO' : turbo === 'S' ? 'SUPERCHARGED' :
      turbo === 'N' || turbo === 'NO' ? 'NONE' : turbo === 'YES' ? 'FORCED_INDUCTION' : null,
    bodyTypeId: text(feed.body_type_id),
    bodyTypeRaw: text(feed.body_type),
    bodyTypeLabel: bodyType ? titleCase(bodyType) : null,
    bodyType,
    frontTyreSize: text(feed.front_tyre_size) ?? text(extra.front_tyre_size),
    rearTyreSize: text(feed.rear_tyre_size) ?? text(extra.rear_tyre_size),
    fuelTankLitres: positive(feed.fuel_tank_size) ?? positive(spec.fuelTankLitres),
    drivetrainSourceId: text(feed.driven_wheels_id),
    mmcode: text(feed.mmcode) ?? text(extra.mmcode),
    stockNumber: text(row.stockNumber) ?? text(feed.stockno),
    additionalInformation: (text(feed.additional_information) ?? text(row.description)) ? titleCase((text(feed.additional_information) ?? text(row.description))!) : null,
    sourceVehicleId: text(feed.vehicle_id) ?? text(source.vehicle_id),
  };
}
