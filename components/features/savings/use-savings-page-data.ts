"use client"

import { useQuery } from "@tanstack/react-query"
import { MONTH_LABELS } from "@/components/features/income/income-bonuses-manager"
import {
  goalsForForecast,
  monthlySurplusForForecast,
  savingsGoalMilestones,
  type SavingsGoalForecastInput,
} from "@/lib/planning/forecast-planning"
import { REPORTING_CURRENCY } from "@/lib/shared/app-currency"
import { fetchJson } from "@/lib/shared/api-error"

type SavingsSummary = {
  burnRate3Mo: number
  expectedMonthlyIncomeBase: number
  reportingCurrency: string
  savingsAccountsTotal: number
  forecastCalendarMonth: number
  activeBonusesThisMonth: { name: string; grossAmountCrc: number }[]
  settings: { crCrcPerUsd: number }
}

export function useSavingsPageData() {
  const summaryQuery = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => fetchJson<SavingsSummary>("/api/analytics/summary"),
  })
  const goalsQuery = useQuery({
    queryKey: ["savings"],
    queryFn: () => fetchJson<SavingsGoalForecastInput[]>("/api/savings"),
  })

  const summary = summaryQuery.data
  const goals = goalsQuery.data
  const expectedIncome = summary?.expectedMonthlyIncomeBase ?? 0
  const burn = summary?.burnRate3Mo ?? 0
  const surplus = monthlySurplusForForecast(
    Number.isFinite(expectedIncome) ? expectedIncome : 0,
    burn,
  )
  const crcPerUsd = summary?.settings.crCrcPerUsd ?? 505
  const milestones =
    goals && goals.length ? savingsGoalMilestones(goalsForForecast(goals, crcPerUsd), surplus) : []
  const baseCurrency = summary?.reportingCurrency ?? REPORTING_CURRENCY
  const monthLabel =
    summary?.forecastCalendarMonth != null ? MONTH_LABELS[summary.forecastCalendarMonth - 1] : null

  return {
    summaryQuery,
    goalsQuery,
    expectedIncome,
    burn,
    surplus,
    milestones,
    baseCurrency,
    monthLabel,
    crcPerUsd,
  }
}
