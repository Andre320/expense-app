import { describe, expect, it } from "vitest"
import { incomeProfileCreateZ } from "./income-profile"

describe("incomeProfileCreateZ", () => {
  it("accepts valid profile", () => {
    const parsed = incomeProfileCreateZ.safeParse({
      label: "2025",
      effectiveFrom: "2025-01-01",
      effectiveTo: null,
      crSalaryGross: 900000,
    })
    expect(parsed.success).toBe(true)
  })

  it("rejects invalid date format", () => {
    const parsed = incomeProfileCreateZ.safeParse({
      label: "Bad",
      effectiveFrom: "01-01-2025",
      crSalaryGross: 1,
    })
    expect(parsed.success).toBe(false)
  })
})
