import { MONTH_LABELS } from "@/components/features/income/income-bonuses-manager"
import { monthlySurplusForForecast } from "@/lib/planning/forecast-planning"
import { REPORTING_CURRENCY } from "@/lib/shared/app-currency"

export type IncomeSummary = {
  burnRate3Mo: number
  expectedMonthlyIncomeBase: number
  reportingCurrency: string
  forecastCalendarMonth: number
  activeBonusesThisMonth: { name: string; grossAmountCrc: number }[]
  settings: { crCrcPerUsd: number }
}

export function deriveIncomeSurplusData(
  liveIncomeBase: number | null,
  summary: IncomeSummary | undefined,
) {
  const expectedIncome = liveIncomeBase ?? summary?.expectedMonthlyIncomeBase ?? 0
  const burn = summary?.burnRate3Mo ?? 0
  const surplus = monthlySurplusForForecast(
    Number.isFinite(expectedIncome) ? expectedIncome : 0,
    burn,
  )
  const baseCurrency = summary?.reportingCurrency ?? REPORTING_CURRENCY
  const monthLabel =
    summary?.forecastCalendarMonth != null ? MONTH_LABELS[summary.forecastCalendarMonth - 1] : null
  const activeBonuses = summary?.activeBonusesThisMonth ?? []
  const hasBonusesThisMonth = activeBonuses.length > 0
  const bonusNames = activeBonuses.map((b) => b.name)
  const crcPerUsd = summary?.settings.crCrcPerUsd ?? 505

  return {
    expectedIncome,
    burn,
    surplus,
    baseCurrency,
    monthLabel,
    hasBonusesThisMonth,
    bonusNames,
    crcPerUsd,
  }
}
