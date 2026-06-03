import { describe, expect, it } from "vitest"
import {
  mergeProfileVoluntaryDeductions,
  pickDeductionFallback,
  profileHasVoluntaryDeductions,
  profileToSettingsWithDeductions,
} from "@/lib/income/income-profile-deductions"
import type { IncomeProfileRow } from "@/lib/income/income-profile-period"

const base: IncomeProfileRow = {
  id: "p1",
  label: "2024",
  effectiveFrom: new Date("2024-01-01"),
  effectiveTo: new Date("2024-12-31"),
  crSalaryGross: 800_000,
  crSalaryCurrency: "CRC",
  crPayPeriod: "MONTHLY",
  crSolidaristaPct: 0,
  crPensionComplementariaPct: 0,
  crEsppPct: 0,
  position: 1,
}

const template: IncomeProfileRow = {
  ...base,
  id: "p2",
  effectiveTo: null,
  crSolidaristaPct: 5,
  crEsppPct: 10,
}

describe("income-profile-deductions", () => {
  it("detects missing voluntary deductions", () => {
    expect(profileHasVoluntaryDeductions(base)).toBe(false)
    expect(profileHasVoluntaryDeductions(template)).toBe(true)
  })

  it("merges fallback deductions for planned net", () => {
    const merged = mergeProfileVoluntaryDeductions(base, template)
    expect(merged.crSolidaristaPct).toBe(5)
    expect(merged.crEsppPct).toBe(10)
  })

  it("pickDeductionFallback prefers open profile with deductions", () => {
    expect(pickDeductionFallback([base, template], null)?.id).toBe("p2")
  })

  it("profileToSettingsWithDeductions applies tax path with merged pct", () => {
    const settings = profileToSettingsWithDeductions(base, 505, template)
    expect(settings.crSolidaristaPct).toBe(5)
    expect(settings.crEsppPct).toBe(10)
  })
})
