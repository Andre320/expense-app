import { describe, expect, it } from "vitest"
import {
  bonusAppliesInMonth,
  bonusGrossForMonth,
  bonusGrossToMonthlyCrc,
  parseBonusMonths,
  stringifyBonusMonths,
} from "@/lib/income/bonus"

describe("parseBonusMonths", () => {
  it("parses valid JSON month array", () => {
    expect(parseBonusMonths("[3,12]")).toEqual([3, 12])
  })

  it("returns empty for invalid JSON", () => {
    expect(parseBonusMonths("not-json")).toEqual([])
  })

  it("filters invalid month numbers", () => {
    expect(parseBonusMonths("[0,13,5]")).toEqual([5])
  })
})

describe("stringifyBonusMonths", () => {
  it("deduplicates and sorts", () => {
    expect(stringifyBonusMonths([12, 3, 3])).toBe("[3,12]")
  })
})

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

describe("bonusGrossForMonth", () => {
  const bonuses = [
    {
      name: "Q1",
      grossAmount: 100_000,
      grossCurrency: "CRC",
      months: [3],
    },
    {
      name: "Q3",
      grossAmount: 100_000,
      grossCurrency: "CRC",
      months: [9],
    },
  ]

  it("sums only bonuses for the given month", () => {
    expect(bonusGrossForMonth(bonuses, 3, 505)).toBe(100_000)
    expect(bonusGrossForMonth(bonuses, 4, 505)).toBe(0)
  })

  it("bonusAppliesInMonth checks membership", () => {
    expect(bonusAppliesInMonth(bonuses[0]!, 3)).toBe(true)
    expect(bonusAppliesInMonth(bonuses[0]!, 4)).toBe(false)
  })
})
