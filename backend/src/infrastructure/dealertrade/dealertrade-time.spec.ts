import { dealerTradeTime } from './dealertrade-time';

it('reads DealerTrade timestamps as South African time', () => {
  expect(dealerTradeTime('2026-10-28 06:00:54')?.toISOString()).toBe('2026-10-28T04:00:54.000Z');
  expect(dealerTradeTime(' 2025-07-20 09:00:55 ')?.toISOString()).toBe('2025-07-20T07:00:55.000Z');
});

it.each([null, undefined, '', 'yesterday', '2026-10-28', '2026-10-28T06:00:54Z', '2026-13-45 99:00:00', 1761624054])('returns null for %p', value => {
  expect(dealerTradeTime(value)).toBeNull();
});
