import { colourStockOptions, standardColourId, standardColourName } from './standard-colours';
it('uses authoritative IDs instead of guessing from paint names', () => {
  expect(standardColourName({ colour_id: 14, colour: 'Pearl White' })).toBe('Unknown');
  expect(standardColourName({ colour_id: 15, colour: 'FROZEN WHITE' })).toBe('White');
  expect(standardColourName({ colour_id: 1 })).toBe('Unknown');
  expect(standardColourName({}, 'Silver')).toBe('Silver');
  expect(standardColourName({}, 'Mystery shade')).toBe('Unknown');
});
it('returns the exact sixteen options, hex codes, zero stock and Any total', () => {
  const result = colourStockOptions([{ colour: 'White' }, { colour: 'Unknown' }, { colour: 'White' }]);
  expect(result).toHaveLength(16);
  expect(result.find(c => c.id === 1)).toMatchObject({ name: 'Any', count: 3, stockCount: 3 });
  expect(result.find(c => c.id === 15)).toMatchObject({ hexCode: '#FFFFFF', count: 2 });
  expect(result.find(c => c.id === 3)).toMatchObject({ count: 0 });
  expect(standardColourId(null)).toBe(14);
});
