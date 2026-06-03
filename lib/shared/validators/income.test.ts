import { describe, expect, it } from "vitest"
import { incomeBonusCreateZ, settingsPatchZ } from "@/lib/shared/validators"

describe("settingsPatchZ", () => {
  it("accepts empty patch", () => {
    expect(settingsPatchZ.safeParse({}).success).toBe(true)
  })

  it("accepts partial salary profile fields", () => {
    const r = settingsPatchZ.safeParse({
      crSalaryGross: 850000,
      crSalaryCurrency: "CRC",
      crPayPeriod: "MONTHLY",
      crSolidaristaPct: 1.5,
    })
    expect(r.success).toBe(true)
  })

  it("rejects crCrcPerUsd that is not positive", () => {
    const r = settingsPatchZ.safeParse({ crCrcPerUsd: 0 })
    expect(r.success).toBe(false)
  })

  it("rejects pct out of range", () => {
    expect(settingsPatchZ.safeParse({ crEsppPct: 101 }).success).toBe(false)
    expect(settingsPatchZ.safeParse({ crEsppPct: -1 }).success).toBe(false)
  })
})

describe("incomeBonusCreateZ", () => {
  it("accepts bonus with payment date", () => {
    expect(
      incomeBonusCreateZ.safeParse({
        name: "Aguinaldo",
        grossAmount: 1000,
        paidOn: "2025-12-01",
        repeatsAnnually: true,
      }).success,
    ).toBe(true)
  })

  it("rejects invalid payment date", () => {
    expect(
      incomeBonusCreateZ.safeParse({
        name: "Bad",
        grossAmount: 1000,
        paidOn: "12/01/2025",
      }).success,
    ).toBe(false)
  })
})
