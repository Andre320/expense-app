import { describe, expect, it } from "vitest"
import { formatGross } from "@/components/features/income/format-bonus-gross"
import type { IncomeBonusDto } from "@/components/features/income/income-bonus-types"

const base: IncomeBonusDto = {
  id: "b1",
  name: "Q1",
  grossAmount: 1000,
  grossCurrency: "USD",
  months: [3],
  position: 0,
}

describe("formatGross", () => {
  it("formats USD with CRC estimate", () => {
    expect(formatGross(base, 505)).toBe("$1,000 (≈ ₡505,000)")
  })

  it("formats CRC without conversion", () => {
    expect(formatGross({ ...base, grossCurrency: "CRC", grossAmount: 250_000 }, 505)).toBe(
      "₡250,000",
    )
  })
})
