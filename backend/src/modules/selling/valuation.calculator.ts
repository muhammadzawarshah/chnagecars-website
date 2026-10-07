import { ConditionGrade } from '../../generated/prisma/client';

/**
 * Automated trade valuation (FR-09). Transparent rules so the business can tune them:
 *  1. Retail reference = median asking price of comparable listings (same model, year ±1),
 *     falling back to the catalogue list price depreciated by age when there are too few.
 *  2. Mileage adjustment vs an expected 15 000 km/year: ±1.5% per 10 000 km, capped at ±20%.
 *  3. Condition multiplier.
 *  4. Trade margin: dealers buy below retail (default 15%).
 *  5. Range ±7% around the estimate. Anything without data goes to manual valuation.
 */
export const VALUATION_RULES = {
  minComparables: 3,
  expectedKmPerYear: 15_000,
  adjustmentPer10kKm: 0.015,
  maxMileageAdjustment: 0.2,
  annualDepreciation: 0.15,
  tradeMargin: 0.15,
  rangeSpread: 0.07,
  condition: { EXCELLENT: 1.03, GOOD: 1.0, FAIR: 0.92, POOR: 0.8 } satisfies Record<ConditionGrade, number>,
} as const;

export interface ValuationInput {
  year: number;
  mileage: number;
  condition: ConditionGrade;
  comparablePrices: number[];
  /** Catalogue list price (new) for the variant, if known. */
  listPrice?: number | null;
  now?: Date;
}

export interface ValuationEstimate {
  low: number;
  mid: number;
  high: number;
  basis: 'COMPARABLES' | 'LIST_PRICE';
  retailReference: number;
  comparableCount: number;
  notes: string;
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

const roundTo = (value: number, step = 500) => Math.round(value / step) * step;

export function estimateValuation(input: ValuationInput): ValuationEstimate | null {
  const now = input.now ?? new Date();
  const age = Math.max(0, now.getFullYear() - input.year);

  let retail: number;
  let basis: ValuationEstimate['basis'];
  if (input.comparablePrices.length >= VALUATION_RULES.minComparables) {
    retail = median(input.comparablePrices);
    basis = 'COMPARABLES';
  } else if (input.listPrice) {
    retail = input.listPrice * Math.pow(1 - VALUATION_RULES.annualDepreciation, age);
    basis = 'LIST_PRICE';
  } else {
    return null;
  }

  const expectedKm = Math.max(1, age) * VALUATION_RULES.expectedKmPerYear;
  const deltaTenK = (expectedKm - input.mileage) / 10_000;
  const mileageFactor =
    1 + Math.max(-VALUATION_RULES.maxMileageAdjustment, Math.min(VALUATION_RULES.maxMileageAdjustment, deltaTenK * VALUATION_RULES.adjustmentPer10kKm));
  const conditionFactor = VALUATION_RULES.condition[input.condition];
  const mid = retail * mileageFactor * conditionFactor * (1 - VALUATION_RULES.tradeMargin);

  return {
    low: roundTo(mid * (1 - VALUATION_RULES.rangeSpread)),
    mid: roundTo(mid),
    high: roundTo(mid * (1 + VALUATION_RULES.rangeSpread)),
    basis,
    retailReference: roundTo(retail),
    comparableCount: input.comparablePrices.length,
    notes:
      basis === 'COMPARABLES'
        ? `Based on ${input.comparablePrices.length} comparable listings; mileage x${mileageFactor.toFixed(2)}, condition x${conditionFactor}`
        : `Based on list price depreciated over ${age} years; mileage x${mileageFactor.toFixed(2)}, condition x${conditionFactor}`,
  };
}
