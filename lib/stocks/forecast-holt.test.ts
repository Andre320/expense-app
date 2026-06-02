import { describe, expect, it } from "vitest"
import {
  barsPerYear,
  computeRSquared,
  holtFit,
  holtForecastLog,
  logReturns,
  momentumLabel,
  olsLogFallback,
  sma,
  stdDev,
  typicalBarMs,
} from "@/lib/stocks/forecast-holt"

describe("forecast-holt helpers", () => {
  it("holtFit returns zeros for empty input", () => {
    expect(holtFit([], 0.3, 0.1)).toEqual({ level: 0, trend: 0 })
  })

  it("holtFit uses zero trend for single observation", () => {
    expect(holtFit([2.3], 0.3, 0.1).trend).toBe(0)
  })

  it("olsLogFallback handles single point", () => {
    expect(olsLogFallback([4.6])).toEqual({ level: 4.6, trend: 0 })
  })

  it("olsLogFallback handles zero denominator", () => {
    const state = olsLogFallback([1, 1, 1])
    expect(state.trend).toBe(0)
  })

  it("computeRSquared returns 0 for short or flat series", () => {
    expect(computeRSquared([1, 2], { level: 1, trend: 0.1 })).toBe(0)
    expect(computeRSquared([5, 5, 5], { level: 5, trend: 0 })).toBe(0)
  })

  it("logReturns skips non-positive prices", () => {
    expect(logReturns([100, 0, 110])).toEqual([])
    expect(logReturns([100, 105])).toHaveLength(1)
  })

  it("stdDev returns 0 for fewer than two values", () => {
    expect(stdDev([1])).toBe(0)
  })

  it("sma returns null when window exceeds length", () => {
    expect(sma([1, 2, 3], 5)).toBeNull()
  })

  it("typicalBarMs uses fallback for single bar", () => {
    expect(typicalBarMs([{ date: "2026-01-01T00:00:00Z", close: 10 }])).toBe(86_400_000)
  })

  it("barsPerYear scales with bar interval", () => {
    const daily = barsPerYear(86_400_000)
    const weekly = barsPerYear(7 * 86_400_000)
    expect(daily).toBeGreaterThan(weekly)
  })

  it("momentumLabel covers mixed short/long branches", () => {
    expect(momentumLabel(1, -0.2)).toBe("up")
    expect(momentumLabel(-1, 0.2)).toBe("down")
    expect(momentumLabel(0.6, -0.6)).toBe("up")
    expect(momentumLabel(-0.6, 0.6)).toBe("down")
    expect(momentumLabel(null, null)).toBe("flat")
  })

  it("holtForecastLog extrapolates trend", () => {
    const state = holtFit([0, 0.1, 0.2], 0.5, 0.3)
    expect(holtForecastLog(state, 2)).toBeGreaterThan(state.level)
  })
})
