import { Prisma } from '../../generated/prisma/client';

/** Provenance comes from the per-vehicle payload, never a legacy slug containing “fbook”. */
export function dealerTradeVehicleWhere(): Prisma.VehicleWhereInput {
  return { sourceData: { path: ['dealertrade', 'vehicle_id'], not: Prisma.AnyNull } };
}
