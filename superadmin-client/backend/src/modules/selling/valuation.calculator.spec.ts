import { estimateValuation, median, VALUATION_RULES } from './valuation.calculator';

const now = new Date('2026-06-01T00:00:00Z');

describe('valuation calculator (FR-09)', () => {
  it('median handles odd and even sizes', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it('uses comparables when there are enough', () => {
    const result = estimateValuation({ year: 2024, mileage: 30_000, condition: 'GOOD', comparablePrices: [400_000, 420_000, 440_000], now })!;
    expect(result.basis).toBe('COMPARABLES');
    expect(result.retailReference).toBe(420_000);
    // expected km for 2 years = 30 000 → no mileage adjustment; GOOD = 1.0; 15% trade margin
    expect(result.mid).toBe(357_000);
    expect(result.low).toBeLessThan(result.mid);
    expect(result.high).toBeGreaterThan(result.mid);
  });

  it('falls back to depreciated list price, else returns null for manual review', () => {
    const fallback = estimateValuation({ year: 2024, mileage: 30_000, condition: 'GOOD', comparablePrices: [1], listPrice: 500_000, now })!;
    expect(fallback.basis).toBe('LIST_PRICE');
    expect(fallback.retailReference).toBe(Math.round((500_000 * (1 - VALUATION_RULES.annualDepreciation) ** 2) / 500) * 500);
    expect(estimateValuation({ year: 2024, mileage: 30_000, condition: 'GOOD', comparablePrices: [], now })).toBeNull();
  });

  it('penalises high mileage and poor condition, with a cap', () => {
    const base = { year: 2022, comparablePrices: [300_000, 300_000, 300_000], now };
    const good = estimateValuation({ ...base, mileage: 60_000, condition: 'GOOD' })!;
    const high = estimateValuation({ ...base, mileage: 200_000, condition: 'GOOD' })!;
    const extreme = estimateValuation({ ...base, mileage: 900_000, condition: 'GOOD' })!;
    const poor = estimateValuation({ ...base, mileage: 60_000, condition: 'POOR' })!;
    expect(high.mid).toBeLessThan(good.mid);
    expect(poor.mid).toBeLessThan(good.mid);
    expect(extreme.mid).toBeGreaterThanOrEqual(Math.round((300_000 * 0.8 * 0.85) / 500) * 500 - 500);
  });
});
