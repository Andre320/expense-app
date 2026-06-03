import { MONTH_LABELS } from "@/components/features/income/income-bonuses-manager"
import {
  goalsForForecast,
  monthlySurplusForForecast,
  savingsGoalMilestones,
  type SavingsGoalForecastInput,
} from "@/lib/planning/forecast-planning"
import { REPORTING_CURRENCY } from "@/lib/shared/app-currency"

export type DashboardSummary = {
  monthly: {
    month: string
    incomeLedger: number
    plannedIncome: number
    expense: number
  }[]
  burnRate3Mo: number
  savingsTotal: number
  savingsAccountsTotal?: number
  expectedMonthlyIncomeBase: number
  ledgerNetBalance: number
  hasSalaryProfile: boolean
  reportingCurrency: string
  forecastCalendarMonth: number
  activeBonusesThisMonth: { name: string; grossAmountCrc: number }[]
  settings: {
    crCrcPerUsd: number
  }
}

export function deriveDashboardData(
  data: DashboardSummary,
  goals: SavingsGoalForecastInput[] | undefined,
) {
  const baseCurrency = data.reportingCurrency ?? REPORTING_CURRENCY
  const chartData = data.monthly.map((m) => ({
    ...m,
    label: m.month.slice(5),
  }))

  const lastMonth = data.monthly.length > 0 ? data.monthly[data.monthly.length - 1]! : null
  const netLast = lastMonth
    ? (lastMonth.plannedIncome > 0 ? lastMonth.plannedIncome : lastMonth.incomeLedger) -
      lastMonth.expense
    : 0

  const surplus = monthlySurplusForForecast(data.expectedMonthlyIncomeBase, data.burnRate3Mo)
  const crcPerUsd = data.settings?.crCrcPerUsd ?? 505
  const milestones =
    goals && goals.length ? savingsGoalMilestones(goalsForForecast(goals, crcPerUsd), surplus) : []

  const monthLabel =
    data.forecastCalendarMonth >= 1 && data.forecastCalendarMonth <= 12
      ? MONTH_LABELS[data.forecastCalendarMonth - 1]
      : undefined
  const bonusNames = (data.activeBonusesThisMonth ?? []).map((b) => b.name)

  return {
    baseCurrency,
    chartData,
    netLast,
    surplus,
    milestones,
    monthLabel,
    bonusNames,
  }
}
