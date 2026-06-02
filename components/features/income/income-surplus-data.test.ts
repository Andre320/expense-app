import { describe, expect, it } from "vitest"
import {
  deriveIncomeSurplusData,
  type IncomeSummary,
} from "@/components/features/income/income-surplus-data"

const summary: IncomeSummary = {
  burnRate3Mo: 400_000,
  expectedMonthlyIncomeBase: 900_000,
  reportingCurrency: "CRC",
  forecastCalendarMonth: 5,
  activeBonusesThisMonth: [{ name: "Bonus A", grossAmountCrc: 50_000 }],
  settings: { crCrcPerUsd: 510 },
}

describe("deriveIncomeSurplusData", () => {
  it("prefers live income base over summary", () => {
    const d = deriveIncomeSurplusData(1_000_000, summary)
    expect(d.expectedIncome).toBe(1_000_000)
    expect(d.surplus).toBe(600_000)
  })

  it("falls back when summary is undefined", () => {
    const d = deriveIncomeSurplusData(null, undefined)
    expect(d.expectedIncome).toBe(0)
    expect(d.burn).toBe(0)
    expect(d.monthLabel).toBeNull()
    expect(d.hasBonusesThisMonth).toBe(false)
    expect(d.crcPerUsd).toBe(505)
  })

  it("maps bonus names and month label from summary", () => {
    const d = deriveIncomeSurplusData(null, summary)
    expect(d.monthLabel).toBe("May")
    expect(d.hasBonusesThisMonth).toBe(true)
    expect(d.bonusNames).toEqual(["Bonus A"])
    expect(d.crcPerUsd).toBe(510)
    expect(d.baseCurrency).toBe("CRC")
  })
})
