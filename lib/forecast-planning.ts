import { roundMoney } from "./currency";
import { plannedNetCrcToMonthlyIncomeBase } from "./utils/taxCalculator";

export type SavingsGoalForecastInput = {
  id: string;
  name: string;
  targetAmount: number | null;
  currentAmount: number;
  priorityOrder: number;
};

export type GoalMilestone = {
  goalId: string;
  name: string;
  priorityOrder: number;
  gapToTarget: number | null;
  /** Months of full surplus to finish this goal after prior goals in queue (null = no target / N/A). */
  monthsForThisGoal: number | null;
  /** Calendar months from now when this goal is fully funded (null if no finite completion). */
  monthsFromNowWhenComplete: number | null;
  progressPct: number | null;
};

/**
 * Monthly surplus for savings forecasting: expected net income (settings / planner)
 * minus trailing average monthly expenses from the ledger.
 */
export function monthlySurplusForForecast(
  expectedNetIncomeBase: number,
  avgMonthlyExpensesFromLedger: number,
): number {
  return roundMoney(expectedNetIncomeBase - avgMonthlyExpensesFromLedger);
}

/**
 * Sequential waterfall: entire surplus goes to the highest-priority goal until its target
 * is met, then the next goal, etc.
 */
export function savingsGoalMilestones(
  goals: SavingsGoalForecastInput[],
  monthlySurplusBase: number,
): GoalMilestone[] {
  const sorted = [...goals].sort(
    (a, b) => a.priorityOrder - b.priorityOrder || a.name.localeCompare(b.name),
  );
  let cumulativeComplete = 0;
  const out: GoalMilestone[] = [];

  for (const g of sorted) {
    const target = g.targetAmount;
    const gap =
      target == null ? null : Math.max(0, roundMoney(target - g.currentAmount));
    let monthsForThisGoal: number | null = null;
    let monthsFromNowWhenComplete: number | null = null;
    const progressPct: number | null =
      target != null && target > 0
        ? Math.min(100, Math.round((g.currentAmount / target) * 1000) / 10)
        : null;

    if (gap == null) {
      monthsForThisGoal = null;
      monthsFromNowWhenComplete = null;
    } else if (gap === 0) {
      monthsForThisGoal = 0;
      monthsFromNowWhenComplete = cumulativeComplete;
    } else if (monthlySurplusBase <= 0) {
      monthsForThisGoal = null;
      monthsFromNowWhenComplete = null;
    } else {
      monthsForThisGoal = Math.ceil(gap / monthlySurplusBase);
      monthsFromNowWhenComplete = cumulativeComplete + monthsForThisGoal;
      cumulativeComplete = monthsFromNowWhenComplete;
    }

    out.push({
      goalId: g.id,
      name: g.name,
      priorityOrder: g.priorityOrder,
      gapToTarget: gap,
      monthsForThisGoal,
      monthsFromNowWhenComplete,
      progressPct,
    });
  }

  return out;
}

/** Convert live CRC net from planner into expected income in base (same rules as save profile). */
export function liveNetCrcToExpectedIncomeBase(params: {
  netMonthlyCrc: number;
  baseCurrency: string;
  quoteCurrency: string;
  quotePerBase: number;
  crCrcPerUsd: number;
}): number {
  return plannedNetCrcToMonthlyIncomeBase({
    netMonthlyCrc: params.netMonthlyCrc,
    baseCurrency: params.baseCurrency,
    quoteCurrency: params.quoteCurrency,
    quotePerBase: params.quotePerBase,
    crCrcPerUsd: params.crCrcPerUsd,
  });
}
