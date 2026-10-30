import { availableVehicleIds, removedVehicleIds, COMING_SOON_VEHICLE_IDS, isComingSoonImage } from './dealertrade-prune';

const row = (id: number, enabled = 1, removed = 0) => ({ vehicle_id: id, enabled, removed });
const rows = (count: number) => Array.from({ length: count }, (_, n) => row(n + 1));

describe('DealerTrade prune', () => {
  it('keeps only enabled vehicles that are not removed', () => {
    const ids = availableVehicleIds([row(1), row(2, 0), row(3, 1, 1)], { uniqueVehicleRows: 3, finalGlobalTotal: 3 });
    expect([...ids]).toEqual(['1']);
  });

  it('accepts a capture within 2% of the DealerTrade total', () => {
    expect(availableVehicleIds(rows(98), { uniqueVehicleRows: 98, finalGlobalTotal: 100 }).size).toBe(98);
  });

  it('refuses an incomplete capture so no car still for sale is deleted', () => {
    expect(() => availableVehicleIds(rows(97), { uniqueVehicleRows: 97, finalGlobalTotal: 100 })).toThrow('nothing is deleted');
    expect(() => availableVehicleIds([], { uniqueVehicleRows: 0, finalGlobalTotal: 0 })).toThrow('nothing is deleted');
  });

  it('refuses rows that do not match the capture report', () => {
    expect(() => availableVehicleIds(rows(10), { uniqueVehicleRows: 9, finalGlobalTotal: 10 })).toThrow('does not match');
  });

  it('only removes explicitly disabled/removed rows, preserving absent and unknown-status cars', () => {
    const removed = removedVehicleIds([row(1), row(2, 0), row(3, 1, 1), { vehicle_id: 4 }]);
    expect([...removed]).toEqual(['2', '3']);
    expect(removed.has('5')).toBe(false);
  });

  it('knows the confirmed coming-soon cars and pictures', () => {
    expect(COMING_SOON_VEHICLE_IDS).toContain('840870');
    expect(isComingSoonImage('89e504bb55362bb9662b3d7945dcdc0a74e5951ab135d1d8a1947c2f7bc75e66')).toBe(true);
    expect(isComingSoonImage('0'.repeat(64))).toBe(false);
  });
});
