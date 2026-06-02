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

  it("ignores blank tickers and deduplicates presets", () => {
    const options = buildStockTickerOptions(["", "  ", "snow", "SNOW"])
    const snowCount = options.filter((o) => o.value === "SNOW").length
    expect(snowCount).toBe(1)
  })

  it("keeps default ticker first in sorted list", () => {
    const options = buildStockTickerOptions(["AAPL"])
    expect(options[0]!.group).toBe("default")
  })

  it("places RSU tickers before preset tickers", () => {
    const options = buildStockTickerOptions(["ZZZ"])
    const z = options.find((o) => o.value === "ZZZ")
    const aapl = options.find((o) => o.value === "AAPL")
    expect(z?.group).toBe("rsu")
    expect(aapl?.group).toBe("preset")
    expect(options.indexOf(z!)).toBeLessThan(options.indexOf(aapl!))
  })

  it("falls back to default ticker when options list is empty", () => {
    expect(normalizeStockTicker("AAPL", [])).toBeTruthy()
  })
})
