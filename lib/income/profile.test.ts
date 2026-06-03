import { describe, expect, it } from "vitest"
import {
  computeExpectedMonthlyIncomeBase,
  computeExpectedNetForMonth,
  computeIncomeProfileBreakdown,
  computeLiveExpectedNetForCurrentMonth,
} from "@/lib/income/profile"

const baseSettings = {
  crSalaryGross: 850_000,
  crSalaryCurrency: "CRC",
  crPayPeriod: "MONTHLY",
  crCrcPerUsd: 505,
  crSolidaristaPct: 0,
  crPensionComplementariaPct: 0,
  crEsppPct: 0,
}

const sampleBonus = {
  name: "Productivity",
  grossAmount: 500_000,
  grossCurrency: "CRC",
  paidOn: "2025-03-01",
  repeatsAnnually: true,
}

describe("computeIncomeProfileBreakdown", () => {
  it("returns null when gross is zero", () => {
    expect(computeIncomeProfileBreakdown({ ...baseSettings, crSalaryGross: 0 })).toBeNull()
  })

  it("parses biweekly USD settings into profile breakdown", () => {
    const result = computeIncomeProfileBreakdown({
      ...baseSettings,
      crPayPeriod: "BIWEEKLY",
      crSalaryCurrency: "USD",
      crSalaryGross: 1000,
    })
    expect(result!.grossMonthlyCrc).toBe(1_010_000)
  })

  it("computes CRC breakdown for monthly gross", () => {
    const result = computeIncomeProfileBreakdown(baseSettings)
    expect(result).not.toBeNull()
    expect(result!.grossMonthlyCrc).toBe(850_000)
    expect(result!.netMonthlyCrc).toBeGreaterThan(0)
  })
})

describe("computeExpectedNetForMonth", () => {
  it("returns 0 when no salary profile", () => {
    expect(
      computeExpectedNetForMonth({ ...baseSettings, crSalaryGross: 0 }, [], "2025-03")
        .expectedNetCrc,
    ).toBe(0)
  })

  it("returns salary-only net when no bonus in month", () => {
    const base = computeExpectedNetForMonth(baseSettings, [], "2025-04")
    const withBonus = computeExpectedNetForMonth(baseSettings, [sampleBonus], "2025-04")
    expect(withBonus.expectedNetCrc).toBe(base.expectedNetCrc)
    expect(withBonus.bonusGrossCrc).toBe(0)
  })

  it("increases net in bonus month but less than naive gross add (taxes apply)", () => {
    const base = computeExpectedNetForMonth(baseSettings, [], "2025-03")
    const withBonus = computeExpectedNetForMonth(baseSettings, [sampleBonus], "2025-03")
    expect(withBonus.bonusGrossCrc).toBe(500_000)
    expect(withBonus.expectedNetCrc).toBeGreaterThan(base.expectedNetCrc)
    expect(withBonus.expectedNetCrc - base.expectedNetCrc).toBeLessThan(500_000)
    expect(withBonus.activeBonuses).toHaveLength(1)
  })

  it("computeExpectedMonthlyIncomeBase uses current month", () => {
    const now = new Date()
    const calendarMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const expected = computeExpectedNetForMonth(baseSettings, [sampleBonus], calendarMonth)
    const fromHelper = computeExpectedMonthlyIncomeBase(baseSettings, [sampleBonus])
    expect(fromHelper).toBe(expected.expectedNetCrc)
  })

  it("computes profile for biweekly USD gross", () => {
    const result = computeIncomeProfileBreakdown({
      ...baseSettings,
      crSalaryGross: 2000,
      crSalaryCurrency: "USD",
      crPayPeriod: "BIWEEKLY",
    })
    expect(result!.grossMonthlyCrc).toBe(2_020_000)
  })

  it("one-off bonus does not apply in other years", () => {
    const oneOff = {
      ...sampleBonus,
      paidOn: "2024-06-15",
      repeatsAnnually: false,
    }
    const june2024 = computeExpectedNetForMonth(baseSettings, [oneOff], "2024-06")
    const june2025 = computeExpectedNetForMonth(baseSettings, [oneOff], "2025-06")
    expect(june2024.bonusGrossCrc).toBe(500_000)
    expect(june2025.bonusGrossCrc).toBe(0)
  })

  it("computeLiveExpectedNetForCurrentMonth uses live salary override", () => {
    const liveNet = computeLiveExpectedNetForCurrentMonth(baseSettings, [sampleBonus], {
      gross: 900_000,
      period: "MONTHLY",
      currency: "CRC",
    })
    expect(liveNet).toBeGreaterThan(0)
  })
})
