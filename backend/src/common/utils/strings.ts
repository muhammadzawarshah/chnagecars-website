import { createHash, randomBytes, randomInt } from 'node:crypto';

/** URL-safe slug: "Mercedes-Benz C 200 AMG" → "mercedes-benz-c-200-amg". */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/**
 * Vehicle and dealer slugs end with their ID ("toyota-hilux-1556378"). Older slugs also carried the
 * import source ("-fbook-1556378", "-dealertrade-1556378"); this maps those old links to the current slug.
 */
export function currentListingSlug(slug: string): string {
  return slug.replace(/-(?:fbook|dealertrade)-(\d+)$/, '-$1');
}

/** Prisma slug filter matching the given slug and its current form, before and after the slug migration. */
export function listingSlugFilter(slug: string): { in: string[] } {
  return { in: [...new Set([slug, currentListingSlug(slug)])] };
}

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Human-friendly reference such as "ENQ-7K3M9Q2X" (no ambiguous characters). */
export function generateReference(prefix: string, length = 8): string {
  let code = '';
  for (let i = 0; i < length; i++) code += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return `${prefix}-${code}`;
}

/** Short random suffix for slugs, e.g. "bmw-320i-2021-x7k2pq". */
export function shortId(length = 6): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < length; i++) id += alphabet[randomInt(alphabet.length)];
  return id;
}

/** Cryptographically random opaque token (refresh tokens, reset tokens, unsubscribe tokens). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Tokens are stored hashed so a database leak does not leak usable tokens. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Splits "a, b ,c" into ["a","b","c"]. */
export function splitCsv(value?: string | string[] | null): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(',') : value;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
