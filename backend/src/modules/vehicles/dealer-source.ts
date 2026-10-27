import { titleCase } from '../../common/utils/display-text';
/** Public dealer details only; private routing/lead emails stay in the source snapshot. */
export function dealerSourceDetails(value: unknown) {
  const r = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const text = (v: unknown) => typeof v === 'string' && v.trim() ? v.trim() : null;
  const link = (v: unknown) => {
    const s = text(v);
    try { const u = new URL(s ?? ''); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; }
    catch { return null; }
  };
  const hours = Array.from({ length: 8 }, (_, i) => ({ day: text(r[`hours_${i + 1}_key`]) ? titleCase(text(r[`hours_${i + 1}_key`])!) : null, time: text(r[`hours_${i + 1}_val`]) ? titleCase(text(r[`hours_${i + 1}_val`])!) : null }))
    .filter((h): h is { day: string; time: string } => !!h.day && !!h.time);
  return { hours: hours.length ? hours : undefined, googleReviewUrl: link(r.google_review), hellopeterReviewUrl: link(r.peter_review) };
}
