import { describe, expect, it } from "vitest"
import {
  assertSingleOpenEndedOnCreate,
  assertSingleOpenEndedOnUpdate,
  assertValidPeriodRange,
  IncomeProfileValidationError,
  parseEffectiveTo,
} from "@/lib/income/services/income-profile-validation"

describe("income-profile-validation", () => {
  it("parseEffectiveTo treats empty as null", () => {
    expect(parseEffectiveTo("")).toBeNull()
    expect(parseEffectiveTo(null)).toBeNull()
  })

  it("assertValidPeriodRange rejects inverted range", () => {
    expect(() => assertValidPeriodRange(new Date("2025-06-01"), new Date("2025-01-01"))).toThrow(
      IncomeProfileValidationError,
    )
  })

  it("assertSingleOpenEndedOnCreate rejects when an open profile exists", () => {
    const profiles = [
      {
        id: "open",
        label: "Current",
        effectiveFrom: new Date("2024-01-01"),
        effectiveTo: null,
        crSalaryGross: 1,
        crSalaryCurrency: "CRC",
        crPayPeriod: "MONTHLY",
        crSolidaristaPct: 0,
        crPensionComplementariaPct: 0,
        crEsppPct: 0,
        position: 1,
      },
    ]
    expect(() => assertSingleOpenEndedOnCreate(profiles, null)).toThrow(
      IncomeProfileValidationError,
    )
  })

  it("assertSingleOpenEndedOnCreate allows bounded new profile", () => {
    const profiles = [
      {
        id: "open",
        label: "Current",
        effectiveFrom: new Date("2024-01-01"),
        effectiveTo: null,
        crSalaryGross: 1,
        crSalaryCurrency: "CRC",
        crPayPeriod: "MONTHLY",
        crSolidaristaPct: 0,
        crPensionComplementariaPct: 0,
        crEsppPct: 0,
        position: 1,
      },
    ]
    expect(() => assertSingleOpenEndedOnCreate(profiles, new Date("2025-12-31"))).not.toThrow()
  })

  it("assertSingleOpenEndedOnUpdate rejects second open profile", () => {
    const profiles = [
      {
        id: "p1",
        label: "A",
        effectiveFrom: new Date("2024-01-01"),
        effectiveTo: new Date("2024-12-31"),
        crSalaryGross: 1,
        crSalaryCurrency: "CRC",
        crPayPeriod: "MONTHLY",
        crSolidaristaPct: 0,
        crPensionComplementariaPct: 0,
        crEsppPct: 0,
        position: 1,
      },
      {
        id: "p2",
        label: "Open",
        effectiveFrom: new Date("2025-01-01"),
        effectiveTo: null,
        crSalaryGross: 2,
        crSalaryCurrency: "CRC",
        crPayPeriod: "MONTHLY",
        crSolidaristaPct: 0,
        crPensionComplementariaPct: 0,
        crEsppPct: 0,
        position: 2,
      },
    ]
    expect(() => assertSingleOpenEndedOnUpdate(profiles, "p1", null, true)).toThrow(
      IncomeProfileValidationError,
    )
  })
})
