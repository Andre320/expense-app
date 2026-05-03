import { roundMoney } from "./currency";

/**
 * Projected balance = current + (monthly income − monthly deductions) × n months.
 * `savingsBoostPct` models “save more” as an increase in monthly deductions (money routed out of spend).
 */
export function projectedBalance(
  currentBalance: number,
  monthlyIncome: number,
  monthlyDeductions: number,
  months: number,
  savingsBoostPct: number,
): number {
  const adjustedDeductions = monthlyDeductions * (1 + savingsBoostPct / 100);
  const net = monthlyIncome - adjustedDeductions;
  return roundMoney(currentBalance + net * months);
}

export function monthlyNet(
  monthlyIncome: number,
  monthlyDeductions: number,
  savingsBoostPct: number,
): number {
  const adjustedDeductions = monthlyDeductions * (1 + savingsBoostPct / 100);
  return roundMoney(monthlyIncome - adjustedDeductions);
}
