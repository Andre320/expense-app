import { describe, expect, it } from "vitest"
import {
  bonusAppliesInCalendarMonth,
  bonusGrossForCalendarMonth,
  bonusGrossToMonthlyCrc,
} from "@/lib/income/bonus"

describe("bonusGrossToMonthlyCrc", () => {
  it("converts USD gross using crc per usd", () => {
    expect(bonusGrossToMonthlyCrc({ grossAmount: 1000, grossCurrency: "USD" }, 505)).toBe(505_000)
  })

  it("passes through CRC gross", () => {
    expect(bonusGrossToMonthlyCrc({ grossAmount: 250_000, grossCurrency: "CRC" }, 505)).toBe(
      250_000,
    )
  })
})

describe("bonusGrossForCalendarMonth", () => {
  const bonuses = [
    {
      name: "2024 Aguinaldo",
      grossAmount: 100_000,
      grossCurrency: "CRC",
      paidOn: "2024-12-01",
      repeatsAnnually: false,
    },
    {
      name: "Productivity",
      grossAmount: 50_000,
      grossCurrency: "CRC",
      paidOn: "2025-03-15",
      repeatsAnnually: true,
    },
  ]

  it("applies one-off bonus only in that year-month", () => {
    expect(bonusGrossForCalendarMonth(bonuses, "2024-12", 505)).toBe(100_000)
    expect(bonusGrossForCalendarMonth(bonuses, "2025-12", 505)).toBe(0)
  })

  it("applies annual bonus in same month every year", () => {
    expect(bonusGrossForCalendarMonth(bonuses, "2025-03", 505)).toBe(50_000)
    expect(bonusGrossForCalendarMonth(bonuses, "2026-03", 505)).toBe(50_000)
    expect(bonusGrossForCalendarMonth(bonuses, "2025-04", 505)).toBe(0)
  })

  it("bonusAppliesInCalendarMonth checks schedule", () => {
    expect(bonusAppliesInCalendarMonth(bonuses[0]!, "2024-12")).toBe(true)
    expect(bonusAppliesInCalendarMonth(bonuses[0]!, "2025-12")).toBe(false)
    expect(bonusAppliesInCalendarMonth(bonuses[1]!, "2026-03")).toBe(true)
  })
})
