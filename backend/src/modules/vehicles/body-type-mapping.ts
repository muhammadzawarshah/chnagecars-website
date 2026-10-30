import definitions from '../web/body-types.json';

type Feed = { body_type_id?: unknown; body_type?: unknown; single_vehicle_url?: unknown };
const normalize = (value: string) => value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[-\s]+/g, ' ');

/** Shared display/filter mapping. Raw feed codes and IDs are never rewritten. */
export function resolveBodyType(feed: Feed) {
  const id = String(feed.body_type_id ?? '');
  // These source types cannot be safely assigned to one of the requested 15 categories.
  if (id === '13' || id === '43') return null;
  if (id === '8') {
    const parts = String(feed.single_vehicle_url ?? '').replace(/^https?:\/\/[^/]+\//, '').split('/');
    return ['coupe', 'coup'].includes(parts[3]) ? definitions.find(type => type.label === 'Coupé')! : null;
  }
  const byId = definitions.find(type => type.sourceIds.some(value => String(value) === id));
  if (byId) return byId;
  const code = typeof feed.body_type === 'string' ? normalize(feed.body_type) : '';
  return code ? definitions.find(type => normalize(type.label) === code || type.sourceCodes.some(value => normalize(value) === code)) ?? null : null;
}

export const BODY_TYPE_CATEGORY_SLUGS = [...new Set(definitions.flatMap(type => type.slugs))];

/** Accept historical category slugs while filtering by the same canonical body group. */
export function expandBodyTypeSlugs(slugs: string[]) {
  return [...new Set(slugs.flatMap(slug => {
    const known = definitions.find(type => type.slugs.includes(slug))
      ?? resolveBodyType({ body_type: slug.replace(/_/g, ' ') });
    return known?.slugs ?? [slug];
  }))];
}
