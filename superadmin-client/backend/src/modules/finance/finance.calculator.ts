/**
 * Pure finance maths (FR-18, FR-19). No I/O, fully unit-tested.
 * All money values are whole rand in, rounded to cents out.
 */

export interface RepaymentInput {
  vehiclePrice: number;
  deposit: number;
  termMonths: number;
  annualInterestRate: number;
  /** Balloon (residual) as a percentage of the vehicle price, e.g. 30. */
  balloonPercent?: number;
}

export interface RepaymentResult {
  vehiclePrice: number;
  deposit: number;
  financeAmount: number;
  balloonAmount: number;
  termMonths: number;
  annualInterestRate: number;
  monthlyRepayment: number;
  totalRepayment: number;
  totalInterest: number;
}

export interface AffordabilityInput {
  monthlyIncome: number;
  monthlyExpenses: number;
  deposit: number;
  termMonths: number;
  annualInterestRate: number;
  balloonPercent?: number;
  /** Maximum share of gross income for a car instalment. Default 0.3 (30%). */
  maxInstalmentRatio?: number;
}

export interface AffordabilityResult {
  monthlyIncome: number;
  monthlyExpenses: number;
  disposableIncome: number;
  maxMonthlyRepayment: number;
  maxFinanceAmount: number;
  estimatedVehicleBudget: number;
  assumptions: string[];
}

export const DEFAULT_FINANCE = {
  termMonths: 72,
  annualInterestRate: 11.75,
  depositPercent: 10,
  balloonPercent: 0,
  maxInstalmentRatio: 0.3,
} as const;

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Monthly instalment for an amortising loan with an optional balloon at the end. */
export function monthlyInstalment(principal: number, annualRate: number, months: number, balloon = 0): number {
  if (months <= 0) throw new RangeError('termMonths must be positive');
  const r = annualRate / 100 / 12;
  if (r === 0) return (principal - balloon) / months;
  const discount = Math.pow(1 + r, -months);
  return ((principal - balloon * discount) * r) / (1 - discount);
}

/** Present value of `months` instalments of `payment` (inverse of monthlyInstalment without balloon). */
export function presentValue(payment: number, annualRate: number, months: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return payment * months;
  return (payment * (1 - Math.pow(1 + r, -months))) / r;
}

export function calculateRepayment(input: RepaymentInput): RepaymentResult {
  const balloonAmount = (input.vehiclePrice * (input.balloonPercent ?? 0)) / 100;
  const financeAmount = Math.max(0, input.vehiclePrice - input.deposit);
  if (balloonAmount > financeAmount) throw new RangeError('Balloon cannot exceed the finance amount');
  const monthly = financeAmount === 0 ? 0 : monthlyInstalment(financeAmount, input.annualInterestRate, input.termMonths, balloonAmount);
  const totalRepayment = monthly * input.termMonths + balloonAmount;
  return {
    vehiclePrice: input.vehiclePrice,
    deposit: input.deposit,
    financeAmount: round2(financeAmount),
    balloonAmount: round2(balloonAmount),
    termMonths: input.termMonths,
    annualInterestRate: input.annualInterestRate,
    monthlyRepayment: round2(monthly),
    totalRepayment: round2(totalRepayment),
    totalInterest: round2(totalRepayment - financeAmount),
  };
}

export function calculateAffordability(input: AffordabilityInput): AffordabilityResult {
  const ratio = input.maxInstalmentRatio ?? DEFAULT_FINANCE.maxInstalmentRatio;
  const disposable = input.monthlyIncome - input.monthlyExpenses;
  const maxMonthly = Math.max(0, Math.min(disposable, input.monthlyIncome * ratio));
  const n = input.termMonths;
  const r = input.annualInterestRate / 100 / 12;
  const discount = r === 0 ? 1 : Math.pow(1 + r, -n);
  const balloonShare = (input.balloonPercent ?? 0) / 100;

  // price = deposit + PV(instalments) + balloon·discount, with balloon = balloonShare·price
  const pvInstalments = presentValue(maxMonthly, input.annualInterestRate, n);
  const price = (input.deposit + pvInstalments) / (1 - balloonShare * discount);
  const financeAmount = Math.max(0, price - input.deposit);

  return {
    monthlyIncome: input.monthlyIncome,
    monthlyExpenses: input.monthlyExpenses,
    disposableIncome: round2(disposable),
    maxMonthlyRepayment: round2(maxMonthly),
    maxFinanceAmount: round2(financeAmount),
    estimatedVehicleBudget: round2(Math.max(input.deposit, price)),
    assumptions: [
      `Instalment capped at ${Math.round(ratio * 100)}% of gross monthly income and at disposable income`,
      `${input.annualInterestRate}% fixed annual interest over ${n} months`,
      balloonShare ? `${input.balloonPercent}% balloon payment` : 'No balloon payment',
      'Excludes insurance, licence, initiation and service fees. Final approval depends on the lender.',
    ],
  };
}

/** Example instalment shown on a vehicle page (FR-04 "finance information where applicable"). */
export function financeExample(vehiclePrice: number): RepaymentResult {
  return calculateRepayment({
    vehiclePrice,
    deposit: Math.round((vehiclePrice * DEFAULT_FINANCE.depositPercent) / 100),
    termMonths: DEFAULT_FINANCE.termMonths,
    annualInterestRate: DEFAULT_FINANCE.annualInterestRate,
    balloonPercent: DEFAULT_FINANCE.balloonPercent,
  });
}
