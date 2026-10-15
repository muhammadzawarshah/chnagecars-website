import { Prisma } from '../../generated/prisma/client';
import { COLLECTION_RULES } from './search.builder';

const labelSelect = { slug: true, name: true } as const;

/** Only public fields needed to filter locally; no images or private listing data. */
export const filterVehicleSelect = {
  id: true, slug: true, title: true, status: true,
  price: true, year: true, mileage: true, seats: true,
  engineCapacityCc: true, powerKw: true, colour: true,
  condition: true, transmission: true, fuelType: true, drivetrain: true,
  province: true, city: true, branchId: true,
  isSpecial: true, isFeatured: true, publishedAt: true,
  latitude: true, longitude: true, popularityScore: true,
  make: { select: labelSelect }, model: { select: labelSelect },
  variant: { select: labelSelect }, dealer: { select: labelSelect },
  categories: { select: { ...labelSelect, isActive: true } },
} satisfies Prisma.VehicleSelect;

type FilterRow = Prisma.VehicleGetPayload<{ select: typeof filterVehicleSelect }>;

export function buildFilterData(rows: FilterRow[]) {
  const vehicles = rows.map(({ popularityScore, categories, ...row }) => ({
    ...row,
    colour: row.colour?.trim().toLowerCase() || null,
    model: { ...row.model, value: `${row.make.slug}:${row.model.slug}` },
    isHotSeller: popularityScore > 0,
    categories: categories.map(({ isActive, ...category }) => category),
  }));

  const options = <T>(values: T[], key: (value: T) => string) => {
    const counts = new Map<string, T & { count: number }>();
    for (const value of values) {
      const id = key(value);
      const existing = counts.get(id);
      if (existing) existing.count++;
      else counts.set(id, { ...value, count: 1 });
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
  };
  const scalar = (field: 'colour' | 'city' | 'province' | 'condition' | 'fuelType' | 'transmission' | 'drivetrain' | 'seats' | 'engineCapacityCc' | 'powerKw') => {
    const values = options(vehicles.flatMap((row) => {
      const value = row[field];
      return value === null ? [] : [{ value }];
    }), (option) => String(option.value));
    return values.sort((a, b) => typeof a.value === 'number' && typeof b.value === 'number'
      ? a.value - b.value : String(a.value).localeCompare(String(b.value)));
  };
  const range = (field: 'price' | 'year' | 'mileage' | 'engineCapacityCc' | 'powerKw') => {
    let min: number | null = null;
    let max: number | null = null;
    for (const row of vehicles) {
      const value = row[field];
      if (value === null) continue;
      min = min === null ? value : Math.min(min, value);
      max = max === null ? value : Math.max(max, value);
    }
    return { min, max };
  };
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    total: vehicles.length,
    collectionRules: COLLECTION_RULES,
    options: {
      makes: options(vehicles.map((row) => row.make), (item) => item.slug),
      models: options(vehicles.map((row) => ({ ...row.model, make: row.make.slug })), (item) => item.value),
      variants: options(vehicles.flatMap((row) => row.variant ? [{ ...row.variant, make: row.make.slug, model: row.model.slug, modelValue: row.model.value }] : []), (item) => `${item.modelValue}:${item.slug}`),
      dealerships: options(vehicles.map((row) => row.dealer), (item) => item.slug),
      branches: options(vehicles.flatMap((row) => row.branchId ? [{ value: row.branchId, dealer: row.dealer.slug }] : []), (item) => item.value),
      categories: options(rows.flatMap((row) => row.categories.filter((item) => item.isActive).map(({ isActive, ...item }) => item)), (item) => item.slug),
      colour: scalar('colour'), city: scalar('city'), province: scalar('province'),
      condition: scalar('condition'), fuelType: scalar('fuelType'), transmission: scalar('transmission'),
      drivetrain: scalar('drivetrain'), seats: scalar('seats'), engineCapacityCc: scalar('engineCapacityCc'), powerKw: scalar('powerKw'),
    },
    ranges: { price: range('price'), year: range('year'), mileage: range('mileage'), engineCapacityCc: range('engineCapacityCc'), powerKw: range('powerKw') },
    vehicles,
  };
}
