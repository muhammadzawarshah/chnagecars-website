import { calculateAffordability, calculateRepayment, monthlyInstalment, presentValue } from './finance.calculator';

describe('finance calculator (FR-18, FR-19)', () => {
  it('computes the standard amortised instalment', () => {
    const result = calculateRepayment({ vehiclePrice: 400_000, deposit: 40_000, termMonths: 72, annualInterestRate: 11.75 });
    expect(result.financeAmount).toBe(360_000);
    expect(result.monthlyRepayment).toBeCloseTo(6991.35, 2);
    expect(result.totalRepayment).toBeCloseTo(6991.35 * 72, 0);
    expect(result.totalInterest).toBeCloseTo(result.totalRepayment - 360_000, 2);
  });

  it('a balloon lowers the instalment and is paid at the end', () => {
    const plain = calculateRepayment({ vehiclePrice: 500_000, deposit: 0, termMonths: 60, annualInterestRate: 12 });
    const balloon = calculateRepayment({ vehiclePrice: 500_000, deposit: 0, termMonths: 60, annualInterestRate: 12, balloonPercent: 30 });
    expect(balloon.balloonAmount).toBe(150_000);
    expect(balloon.monthlyRepayment).toBeLessThan(plain.monthlyRepayment);
    expect(Math.abs(balloon.totalRepayment - (balloon.monthlyRepayment * 60 + 150_000))).toBeLessThan(1);
  });

  it('handles zero interest', () => {
    expect(monthlyInstalment(120_000, 0, 12)).toBe(10_000);
    expect(presentValue(10_000, 0, 12)).toBe(120_000);
  });

  it('presentValue is the inverse of monthlyInstalment', () => {
    const payment = monthlyInstalment(300_000, 11.75, 72);
    expect(presentValue(payment, 11.75, 72)).toBeCloseTo(300_000, 4);
  });

  it('rejects a balloon larger than the finance amount', () => {
    expect(() => calculateRepayment({ vehiclePrice: 100_000, deposit: 90_000, termMonths: 12, annualInterestRate: 10, balloonPercent: 50 })).toThrow();
  });

  it('caps affordability at 30% of income and at disposable income', () => {
    const rich = calculateAffordability({ monthlyIncome: 40_000, monthlyExpenses: 10_000, deposit: 0, termMonths: 72, annualInterestRate: 11.75 });
    expect(rich.maxMonthlyRepayment).toBe(12_000);
    const tight = calculateAffordability({ monthlyIncome: 40_000, monthlyExpenses: 35_000, deposit: 0, termMonths: 72, annualInterestRate: 11.75 });
    expect(tight.maxMonthlyRepayment).toBe(5_000);
    const broke = calculateAffordability({ monthlyIncome: 20_000, monthlyExpenses: 25_000, deposit: 10_000, termMonths: 72, annualInterestRate: 11.75 });
    expect(broke.maxMonthlyRepayment).toBe(0);
    expect(broke.estimatedVehicleBudget).toBe(10_000);
  });

  it('budget round-trips through the repayment calculator', () => {
    const budget = calculateAffordability({ monthlyIncome: 40_000, monthlyExpenses: 20_000, deposit: 50_000, termMonths: 72, annualInterestRate: 11.75, balloonPercent: 20 });
    const check = calculateRepayment({ vehiclePrice: budget.estimatedVehicleBudget, deposit: 50_000, termMonths: 72, annualInterestRate: 11.75, balloonPercent: 20 });
    expect(check.monthlyRepayment).toBeCloseTo(budget.maxMonthlyRepayment, 0);
  });
});
