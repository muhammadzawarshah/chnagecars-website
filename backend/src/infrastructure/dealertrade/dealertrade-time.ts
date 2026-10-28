/**
 * DealerTrade timestamps ("2026-10-28 06:00:54") carry no zone; they are South African time (UTC+2, no DST).
 * Returns null for anything that isn't in that exact shape.
 */
export function dealerTradeTime(value: unknown): Date | null {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)) return null;
  const date = new Date(`${text.replace(' ', 'T')}+02:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
