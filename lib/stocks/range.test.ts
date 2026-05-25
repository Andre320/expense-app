import { describe, expect, it } from "vitest"
import { parseStockRange, STOCK_RANGES } from "@/lib/stocks/range"

describe("parseStockRange", () => {
  it("accepts valid range values", () => {
    for (const range of STOCK_RANGES) {
      expect(parseStockRange(range)).toBe(range)
    }
  })

  it("defaults unknown values to month", () => {
    expect(parseStockRange(null)).toBe("month")
    expect(parseStockRange("quarter")).toBe("month")
    expect(parseStockRange("")).toBe("month")
  })
})
