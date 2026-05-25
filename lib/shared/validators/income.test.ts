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
  it("accepts unique bonus months", () => {
    expect(
      incomeBonusCreateZ.safeParse({
        name: "Annual",
        grossAmount: 1000,
        months: [3, 6, 12],
      }).success,
    ).toBe(true)
  })

  it("rejects duplicate bonus months", () => {
    expect(
      incomeBonusCreateZ.safeParse({
        name: "Dup",
        grossAmount: 1000,
        months: [3, 3],
      }).success,
    ).toBe(false)
  })
})
