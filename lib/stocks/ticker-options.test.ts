import { describe, expect, it } from "vitest"
import { buildStockTickerOptions, normalizeStockTicker } from "@/lib/stocks/ticker-options"

describe("buildStockTickerOptions", () => {
  it("includes RSU tickers and presets without duplicates", () => {
    const options = buildStockTickerOptions(["SNOW", "AAPL"])
    const values = options.map((o) => o.value)
    expect(values).toContain("SNOW")
    expect(values).toContain("AAPL")
    expect(values.filter((v) => v === "SNOW")).toHaveLength(1)
  })

  it("falls back to first option for unknown ticker", () => {
    const options = buildStockTickerOptions([])
    expect(normalizeStockTicker("ZZZZ", options)).toBe(options[0]!.value)
    expect(normalizeStockTicker("SNOW", options)).toBe("SNOW")
  })
})
