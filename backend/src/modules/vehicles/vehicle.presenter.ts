import { ImageStatus, Prisma, VehicleStatus } from '../../generated/prisma/client';
import { availabilityOf } from './vehicle-lifecycle';

/** Columns safe to expose publicly. VIN, registration, review notes and internal ids are excluded (NFR-17). */
export const publicVehicleSelect = {
  id: true,
  slug: true,
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
  variant: { select: { id: true, name: true, slug: true } },
  dealer: { select: { id: true, name: true, slug: true, logoUrl: true, rating: true, plan: true } },
  branch: { select: { id: true, name: true, city: true, province: true } },
  categories: { select: { slug: true, name: true } },
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

export function withAvailability<T extends { status: VehicleStatus; price: number; specialPrice: number | null; isSpecial: boolean }>(vehicle: T) {
  return {
    ...vehicle,
    availability: availabilityOf(vehicle.status),
    effectivePrice: effectivePrice(vehicle),
    discount: vehicle.isSpecial && vehicle.specialPrice && vehicle.specialPrice < vehicle.price ? vehicle.price - vehicle.specialPrice : null,
  };
}
