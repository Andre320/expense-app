import { describe, expect, it } from "vitest"
import {
  deriveDashboardData,
  type DashboardSummary,
} from "@/components/features/dashboard/use-dashboard-data"
import type { SavingsGoalForecastInput } from "@/lib/planning/forecast-planning"

const base: DashboardSummary = {
  monthly: [
    { month: "2025-03", income: 1000, expense: 600 },
    { month: "2025-04", income: 1100, expense: 700 },
  ],
  burnRate3Mo: 650,
  savingsTotal: 5000,
  expectedMonthlyIncomeBase: 1000,
  ledgerNetBalance: 200,
  hasSalaryProfile: true,
  reportingCurrency: "CRC",
  forecastCalendarMonth: 4,
  activeBonusesThisMonth: [{ name: "Easter", grossAmountCrc: 100 }],
  settings: { crCrcPerUsd: 500 },
}

describe("deriveDashboardData", () => {
  it("derives chart labels and net for last month", () => {
    const d = deriveDashboardData(base, undefined)
    expect(d.chartData[1]!.label).toBe("04")
    expect(d.netLast).toBe(400)
    expect(d.surplus).toBe(350)
    expect(d.monthLabel).toBe("Abr")
    expect(d.bonusNames).toEqual(["Easter"])
    expect(d.milestones).toEqual([])
  })

  it("builds milestones when goals are provided", () => {
    const goals: SavingsGoalForecastInput[] = [
      {
        id: "g1",
        name: "Emergency",
        currency: "CRC",
        targetAmount: 1000,
        currentAmount: 200,
        priorityOrder: 1,
      },
    ]
    const d = deriveDashboardData(base, goals)
    expect(d.milestones.length).toBeGreaterThan(0)
  })

  it("handles empty monthly series", () => {
    const d = deriveDashboardData({ ...base, monthly: [] }, [])
    expect(d.netLast).toBe(0)
    expect(d.chartData).toEqual([])
  })

  it("omits month label when forecast month is out of range", () => {
    const d = deriveDashboardData({ ...base, forecastCalendarMonth: 0 }, undefined)
    expect(d.monthLabel).toBeUndefined()
  })
})
