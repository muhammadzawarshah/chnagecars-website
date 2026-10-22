import { slugify } from './strings';

/** Province names exactly as stored in the database and returned by the API. */
export const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
] as const;
export type Province = (typeof PROVINCES)[number];

/** Legacy enum keys → stored names, so code can keep writing `Province.GAUTENG`. */
export const Province = {
  EASTERN_CAPE: 'Eastern Cape',
  FREE_STATE: 'Free State',
  GAUTENG: 'Gauteng',
  KWAZULU_NATAL: 'KwaZulu-Natal',
  LIMPOPO: 'Limpopo',
  MPUMALANGA: 'Mpumalanga',
  NORTHERN_CAPE: 'Northern Cape',
  NORTH_WEST: 'North West',
  WESTERN_CAPE: 'Western Cape',
} as const satisfies Record<string, Province>;

const BY_SLUG = new Map<string, Province>(
  Object.entries(Province).flatMap(([key, name]) => [
    [slugify(name), name],
    [slugify(key), name],
  ]),
);

/** "KwaZulu-Natal", "kwazulu natal" or legacy "KWAZULU_NATAL" → "KwaZulu-Natal"; unknown input → undefined. */
export function toProvince(raw: unknown): Province | undefined {
  return typeof raw === 'string' ? BY_SLUG.get(slugify(raw)) : undefined;
}

/** class-transformer `@Transform` callback: normalises legacy keys (single value or array) before validation. */
export const provinceInput = ({ value }: { value: unknown }) =>
  Array.isArray(value) ? value.map((item) => toProvince(item) ?? item) : (toProvince(value) ?? value);
