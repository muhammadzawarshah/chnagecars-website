import { titleCase } from './display-text';
it('title cases human text and preserves embedded URLs and email addresses', () => {
  expect(titleCase('BMW X5 FROZEN WHITE')).toBe('Bmw X5 Frozen White');
  expect(titleCase('LEATHER SEATS, ONE OWNER')).toBe('Leather Seats, One Owner');
  expect(titleCase('VISIT https://EXAMPLE.com/Aa OR Sales@Dealer.co.za')).toBe('Visit https://EXAMPLE.com/Aa Or Sales@Dealer.co.za');
});
