import comingSoon from './coming-soon.json';

/** Below this share of DealerTrade's own total a capture is treated as incomplete and nothing is deleted. */
export const MIN_CAPTURE_SHARE = 0.98;

type CaptureReport = { uniqueVehicleRows?: unknown; finalGlobalTotal?: unknown };

/**
 * Vehicle IDs DealerTrade lists as available (enabled and not removed). Throws when the capture is not complete
 * enough to delete stock by absence: a partial fetch must never remove cars that are still for sale.
 */
export function availableVehicleIds(rows: Record<string, unknown>[], report: CaptureReport): Set<string> {
  const total = Number(report.finalGlobalTotal);
  if (report.uniqueVehicleRows !== rows.length) throw new Error('capture report does not match the captured rows');
  if (!rows.length || !(total > 0) || rows.length < total * MIN_CAPTURE_SHARE) {
    throw new Error(`capture has ${rows.length} of ${total} DealerTrade vehicles; nothing is deleted`);
  }
  return new Set(rows.filter((row) => row.enabled === 1 && row.removed === 0).map((row) => String(row.vehicle_id)));
}

const placeholderHashes = new Set(comingSoon.imageSha256);
const comingSoonIds = new Set(comingSoon.vehicleIds);

/** DealerTrade vehicles confirmed to show an "images coming soon" picture as their main photo. */
export const COMING_SOON_VEHICLE_IDS = [...comingSoonIds];

/** sha256 of a main photo that is one of DealerTrade's "images coming soon" pictures. */
export const isComingSoonImage = (sha256: string) => placeholderHashes.has(sha256);

/** Missing rows cannot prove removal during a non-atomic traversal. */
export function removedVehicleIds(rows: Record<string, unknown>[]): Set<string> {
  return new Set(rows.filter(row => row.enabled === 0 || row.removed === 1)
    .map(row => String(row.vehicle_id)));
}
