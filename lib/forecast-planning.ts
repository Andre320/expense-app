import { roundMoney, amountToReportingBase } from "./currency";
import { plannedNetCrcToMonthlyIncomeBase } from "./utils/taxCalculator";

export type SavingsGoalForecastInput = {
  id: string;
  name: string;
  targetAmount: number | null;
  currentAmount: number;
  priorityOrder: number;
  currency?: string;
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
 * Monthly surplus for savings forecasting: expected net income (salary profile)
 * minus trailing average monthly expenses from the ledger.
 */
export function monthlySurplusForForecast(
  expectedNetIncomeBase: number,
  avgMonthlyExpensesFromLedger: number,
): number {
  return roundMoney(expectedNetIncomeBase - avgMonthlyExpensesFromLedger);
}

/** Normalize goal amounts to CRC for surplus-based forecast math. */
export function goalsForForecast(
  goals: SavingsGoalForecastInput[],
  crcPerUsd: number,
): SavingsGoalForecastInput[] {
  return goals.map((g) => {
    const cur = g.currency ?? "CRC";
    return {
      ...g,
      currentAmount: amountToReportingBase(g.currentAmount, cur, crcPerUsd),
      targetAmount:
        g.targetAmount == null
          ? null
          : amountToReportingBase(g.targetAmount, cur, crcPerUsd),
    };
  });
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

/** Live CRC net from the Income calculator (reporting currency is CRC). */
export function liveNetCrcToExpectedIncomeBase(params: {
  netMonthlyCrc: number;
}): number {
  return plannedNetCrcToMonthlyIncomeBase({
    netMonthlyCrc: params.netMonthlyCrc,
  });
}
