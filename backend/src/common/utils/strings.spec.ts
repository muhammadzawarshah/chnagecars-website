import { currentListingSlug, listingSlugFilter } from './strings';

it('matches both the given slug and its current form, so links work before and after the slug migration', () => {
  expect(listingSlugFilter('audi-q3-fbook-1556517')).toEqual({ in: ['audi-q3-fbook-1556517', 'audi-q3-1556517'] });
  expect(listingSlugFilter('audi-q3-1556517')).toEqual({ in: ['audi-q3-1556517'] });
});

it.each([
  ['mazda-mazda3-1-5-dynamic-a-t-5dr-fbook-1575860', 'mazda-mazda3-1-5-dynamic-a-t-5dr-1575860'],
  ['ford-ranger-2-2tdci-xl-dealertrade-1561392', 'ford-ranger-2-2tdci-xl-1561392'],
  ['gys-pitzer-motors-lindo-park-fbook-3974', 'gys-pitzer-motors-lindo-park-3974'],
])('maps the old source-tagged slug %s to the current slug', (old, current) => {
  expect(currentListingSlug(old)).toBe(current);
  expect(currentListingSlug(current)).toBe(current);
});

it.each(['fbook-motors-pretoria', 'dealertrade-cars', 'audi-q3-fbook', 'vw-polo-fbook-1a'])('leaves %s unchanged', slug => {
  expect(currentListingSlug(slug)).toBe(slug);
});
