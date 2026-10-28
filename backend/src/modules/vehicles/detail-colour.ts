import { titleCase } from '../../common/utils/display-text';
/** Detail pages may show the supplier's specific paint name; filters keep Vehicle.colour. */
export function detailColour(vehicle: { colour?: string | null; sourceData?: unknown }): string | null {
  const source = vehicle.sourceData;
  const feed = source && typeof source === 'object' && !Array.isArray(source)
    ? (source as Record<string, unknown>).dealertrade : undefined;
  const raw = feed && typeof feed === 'object' && !Array.isArray(feed)
    ? (feed as Record<string, unknown>).colour : undefined;
  if (typeof raw === 'string') {
    const colour = raw.trim();
    if (colour && !/^(n\/?a|null|none|unknown)$/i.test(colour)) return titleCase(colour);
  }
  return vehicle.colour ?? null;
}

/** Supplier IDs are metadata; they never replace the existing colour filter key. */
export function dealerTradeColourId(vehicle: { sourceData?: unknown }): number | null {
  const source = vehicle.sourceData as { dealertrade?: { colour_id?: unknown } } | null;
  const raw = source?.dealertrade?.colour_id;
  if (typeof raw !== 'number' && typeof raw !== 'string') return null;
  if (typeof raw === 'string' && !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
