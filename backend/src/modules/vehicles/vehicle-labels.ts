import { FuelType, Transmission, VehicleCondition } from '../../generated/prisma/client';

/** Display names the public vehicle APIs return instead of stored enum codes ("PETROL" → "Petrol"). */
export const VEHICLE_LABELS = {
  condition: { NEW: 'New', USED: 'Used', DEMO: 'Demo' } satisfies Record<VehicleCondition, string>,
  fuelType: {
    PETROL: 'Petrol', DIESEL: 'Diesel', HYBRID: 'Hybrid', PLUGIN_HYBRID: 'Plug-in Hybrid', ELECTRIC: 'Electric', LPG: 'LPG', OTHER: 'Other',
  } satisfies Record<FuelType, string>,
  transmission: { UNKNOWN: 'Unknown', MANUAL: 'Manual', AUTOMATIC: 'Automatic' } satisfies Record<Transmission, string>,
};

export type LabelledField = keyof typeof VEHICLE_LABELS;

export function vehicleLabel<V extends string | null | undefined>(field: LabelledField, value: V): string | V {
  return value == null ? value : (VEHICLE_LABELS[field] as Record<string, string>)[value] ?? value;
}

/** Replaces condition, fuelType and transmission codes with their display names. */
export function withVehicleLabels<T extends object>(vehicle: T): T {
  const row = { ...vehicle } as Record<string, unknown>;
  for (const field of Object.keys(VEHICLE_LABELS) as LabelledField[]) {
    if (typeof row[field] === 'string') row[field] = vehicleLabel(field, row[field] as string);
  }
  return row as T;
}
