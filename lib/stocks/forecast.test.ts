import { describe, expect, it } from "vitest"
import { buildStockForecast, priceAtDate, priceScenarioAtDate } from "@/lib/stocks/forecast"
import { HOLT_BY_RANGE } from "@/lib/stocks/range"

function risingBars(count: number, start = 100, step = 2) {
  return Array.from({ length: count }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
    close: start + i * step,
  }))
}

describe("buildStockForecast", () => {
  it("projects upward base above last close on rising series", () => {
    const bars = risingBars(20)
    const forecast = buildStockForecast(bars, HOLT_BY_RANGE.month)
    expect(forecast).not.toBeNull()
    expect(forecast!.summary.base).toBeGreaterThan(bars.at(-1)!.close)
    expect(forecast!.summary.bull).toBeGreaterThan(forecast!.summary.base)
    expect(forecast!.summary.bear).toBeLessThan(forecast!.summary.base)
  })

  it("widens volatility bands with sqrt(h) at horizon", () => {
    const bars = risingBars(15, 200, 0.5)
    const forecast = buildStockForecast(bars, { ...HOLT_BY_RANGE.month, horizonBars: 10 })
    expect(forecast).not.toBeNull()
    const hist = forecast!.points.filter((p) => p.kind === "history")
    const fc = forecast!.points.filter((p) => p.kind === "forecast")
    const lastHist = hist.at(-1)!
    const firstFc = fc[0]!
    const lastFc = fc.at(-1)!
    const widthEarly = (firstFc.upper68! - firstFc.lower68!) / firstFc.central!
    const widthLate = (lastFc.upper68! - lastFc.lower68!) / lastFc.central!
    expect(widthLate).toBeGreaterThan(widthEarly)
    expect(lastHist.upper68! - lastHist.lower68!).toBeLessThan(lastFc.upper68! - lastFc.lower68!)
  })

  it("falls back gracefully with fewer than 10 bars", () => {
    const bars = risingBars(6)
    const forecast = buildStockForecast(bars, HOLT_BY_RANGE.month)
    expect(forecast).not.toBeNull()
    expect(forecast!.summary.base).toBeGreaterThan(0)
    expect(forecast!.points.some((p) => p.kind === "forecast")).toBe(true)
  })

  it("returns null when too few bars", () => {
    expect(buildStockForecast(risingBars(2), HOLT_BY_RANGE.month)).toBeNull()
  })

  it("handles bars with identical timestamps", () => {
    const bars = Array.from({ length: 10 }, (_, i) => ({
      date: "2026-01-01T12:00:00Z",
      close: 100 + i,
    }))
    const forecast = buildStockForecast(bars, HOLT_BY_RANGE.month)
    expect(forecast).not.toBeNull()
  })

  it("labels flat momentum on constant prices", () => {
    const bars = Array.from({ length: 20 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
      close: 100,
    }))
    const forecast = buildStockForecast(bars, HOLT_BY_RANGE.month)
    expect(forecast!.summary.momentum).toBe("flat")
    expect(forecast!.summary.rangePositionPct).toBe(50)
  })

  it("labels up momentum on strong rising series", () => {
    const bars = Array.from({ length: 25 }, (_, i) => ({
      date: `2026-01-${String((i % 28) + 1).padStart(2, "0")}T12:00:00Z`,
      close: 50 + i * 5,
    }))
    const forecast = buildStockForecast(bars, HOLT_BY_RANGE.month)
    expect(forecast!.summary.momentum).toBe("up")
  })

  it("handles zero or negative closes in log transform", () => {
    const bars = [
      { date: "2026-01-01T12:00:00Z", close: 0 },
      { date: "2026-01-02T12:00:00Z", close: 100 },
      { date: "2026-01-03T12:00:00Z", close: 105 },
      { date: "2026-01-04T12:00:00Z", close: 110 },
    ]
    expect(buildStockForecast(bars, HOLT_BY_RANGE.month)).not.toBeNull()
  })

  it("labels down momentum on falling prices", () => {
    const bars = Array.from({ length: 20 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
      close: 200 - i * 3,
    }))
    const forecast = buildStockForecast(bars, HOLT_BY_RANGE.month)
    expect(forecast!.summary.momentum).toBe("down")
  })
})

describe("priceAtDate", () => {
  it("interpolates forecast price at future date", () => {
    const bars = risingBars(12)
    const forecast = buildStockForecast(bars, HOLT_BY_RANGE.month)!
    const future = new Date(bars.at(-1)!.date)
    future.setDate(future.getDate() + 3)
    const price = priceAtDate(forecast, future)
    expect(price).not.toBeNull()
    expect(price!).toBeGreaterThan(bars.at(-1)!.close * 0.9)
  })

  it("returns nearest historical close for past dates", () => {
    const bars = risingBars(12)
    const forecast = buildStockForecast(bars, HOLT_BY_RANGE.month)!
    const past = new Date(bars[0]!.date)
    past.setDate(past.getDate() - 5)
    expect(priceAtDate(forecast, past)).toBe(bars[0]!.close)
  })

  it("falls back to summary base when no forecast points", () => {
    const bars = risingBars(12)
    const forecast = buildStockForecast(bars, HOLT_BY_RANGE.month)!
    forecast.points = forecast.points.filter((p) => p.kind === "history")
    const future = new Date(bars.at(-1)!.date)
    future.setDate(future.getDate() + 10)
    expect(priceAtDate(forecast, future)).toBe(forecast.summary.base)
  })
})

describe("priceScenarioAtDate", () => {
  it("scales base price for bear and bull scenarios", () => {
    const bars = risingBars(12)
    const forecast = buildStockForecast(bars, HOLT_BY_RANGE.month)!
    const target = new Date(bars.at(-1)!.date)
    target.setDate(target.getDate() + 2)

    const base = priceScenarioAtDate(forecast, target, "base")
    const bear = priceScenarioAtDate(forecast, target, "bear")
    const bull = priceScenarioAtDate(forecast, target, "bull")

    expect(base).not.toBeNull()
    expect(bear!).toBeLessThan(base!)
    expect(bull!).toBeGreaterThan(base!)
  })

  it("returns null when base price is unavailable", () => {
    const bars = risingBars(12)
    const forecast = buildStockForecast(bars, HOLT_BY_RANGE.month)!
    forecast.points = []
    forecast.summary.base = 0
    expect(priceScenarioAtDate(forecast, new Date("1990-01-01"), "bull")).toBeNull()
  })

  it("interpolates between two forecast points", () => {
    const bars = risingBars(12)
    const forecast = buildStockForecast(bars, HOLT_BY_RANGE.month)!
    const forecastPts = forecast.points.filter((p) => p.kind === "forecast")
    const target = new Date(forecastPts[1]!.date)
    target.setHours(target.getHours() - 1)
    expect(priceAtDate(forecast, target)).not.toBeNull()
  })
})
