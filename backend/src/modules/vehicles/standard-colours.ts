/** DealerTrade list_colours IDs; Any is a selection, not a physical paint colour. */
export const STANDARD_COLOURS = [
  [1, 'Any', 'Enige', ''], [2, 'Beige', 'Beige', '#C9B89A'], [3, 'Black', 'Swart', '#000000'],
  [4, 'Blue', 'Blou', '#2A6FDB'], [5, 'Brown', 'Bruin', '#7A4E2E'], [6, 'Gold', 'Goud', '#D6A743'],
  [7, 'Green', 'Groen', '#2F8D4E'], [8, 'Grey', 'Grys', '#8A8A8A'], [9, 'Orange', 'Oranje', '#E6782F'],
  [10, 'Pink', 'Pienk', '#D86197'], [11, 'Purple', 'Pers', '#8257C7'], [12, 'Red', 'Rooi', '#C9433D'],
  [13, 'Silver', 'Silwer', '#A9A9A9'], [14, 'Unknown', 'Onbekend', '#DDDCDC'], [15, 'White', 'Wit', '#FFFFFF'],
  [16, 'Yellow', 'Geel', '#DCC73A'],
].map(([id, name, afrName, hexCode]) => ({ id: id as number, name: name as string, afrName: afrName as string, hexCode: hexCode as string, slug: String(name).toLowerCase() }));

export function standardColourName(feed: Record<string, unknown>, existing?: string | null): string {
  const raw = feed.colour_id;
  if (raw !== undefined && raw !== null && raw !== '') {
    const id = Number(raw);
    return STANDARD_COLOURS.find(c => c.id === id && id !== 1)?.name ?? 'Unknown';
  }
  const name = String(existing ?? feed.colour ?? '').trim().toLowerCase();
  return STANDARD_COLOURS.find(c => c.slug === name && c.id !== 1)?.name ?? 'Unknown';
}
export function standardColourId(name: string | null | undefined): number {
  return STANDARD_COLOURS.find(c => c.slug === name?.trim().toLowerCase() && c.id !== 1)?.id ?? 14;
}
export function selectedColourIds(criteria: { colourId?: string; colour_id?: string; color_id?: string }): number[] {
  return [...new Set([criteria.colourId, criteria.colour_id, criteria.color_id].flatMap(v => v?.split(',').map(Number) ?? []))];
}
export function colourStockOptions(rows: { colour: string | null }[]) {
  const counts = new Map<number, number>();
  for (const row of rows) { const id = standardColourId(row.colour); counts.set(id, (counts.get(id) ?? 0) + 1); }
  return STANDARD_COLOURS.map(c => ({ ...c, value: c.slug, count: c.id === 1 ? rows.length : counts.get(c.id) ?? 0, stockCount: c.id === 1 ? rows.length : counts.get(c.id) ?? 0 }));
}
