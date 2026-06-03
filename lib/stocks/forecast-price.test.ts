import { describe, expect, it } from "vitest"
import {
  buildStockForecast,
  priceAtDate,
  priceScenarioAtDate,
  type StockForecast,
} from "@/lib/stocks/forecast"
import { HOLT_BY_RANGE } from "@/lib/stocks/range"

function risingBars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, "0")}T12:00:00.000Z`,
    close: 100 + i * 2,
  }))
}

function minimalForecast(points: StockForecast["points"]): StockForecast {
  return {
    points,
    summary: {
      base: 100,
      bear: 80,
      bull: 120,
      driftPctAnn: 5,
      volatilityPctAnn: 10,
      momentum: "flat",
      rangePositionPct: 50,
      rSquared: 0.5,
      horizonBars: 2,
      smaShortPct: null,
      smaLongPct: null,
    },
    barMs: 86_400_000,
    lastDate: "2026-01-01T00:00:00.000Z",
  }
}

describe("forecast-price", () => {
  it("falls back to upper68 when central is null on bracket points", () => {
    const forecast = minimalForecast([
      {
        date: "2026-01-02T00:00:00.000Z",
        close: null,
        central: null,
        lower68: 90,
        upper68: 110,
        lower95: 80,
        upper95: 120,
        kind: "forecast",
      },
      {
        date: "2026-01-03T00:00:00.000Z",
        close: null,
        central: null,
        lower68: 95,
        upper68: 115,
        lower95: 85,
        upper95: 125,
        kind: "forecast",
      },
    ])
    const target = new Date("2026-01-02T12:00:00.000Z")
    const price = priceAtDate(forecast, target)
    expect(price).not.toBeNull()
    expect(price!).toBeGreaterThanOrEqual(110)
    expect(price!).toBeLessThanOrEqual(115)
  })

  it("interpolates when target falls between two forecast points", () => {
    const forecast = buildStockForecast(risingBars(14), {
      ...HOLT_BY_RANGE.month,
      horizonBars: 5,
    })!
    const pts = forecast.points.filter((p) => p.kind === "forecast")
    const mid = new Date(pts[0]!.date)
    mid.setHours(mid.getHours() + 12)
    const price = priceAtDate(forecast, mid)
    expect(price).not.toBeNull()
    expect(price!).toBeGreaterThan(0)
  })

  it("uses single bracket when only one forecast point matches", () => {
    const forecast = buildStockForecast(risingBars(12), HOLT_BY_RANGE.month)!
    const only = forecast.points.filter((p) => p.kind === "forecast")[0]!
    const at = new Date(only.date)
    expect(priceAtDate(forecast, at)).toBe(only.central)
  })

  it("interpolates using upper68 when central is null", () => {
    const forecast = buildStockForecast(risingBars(12), HOLT_BY_RANGE.month)!
    const pts = forecast.points.filter((p) => p.kind === "forecast")
    pts[0]!.central = null
    pts[1]!.central = null
    const target = new Date(pts[0]!.date)
    target.setHours(target.getHours() + 6)
    expect(priceAtDate(forecast, target)).not.toBeNull()
  })

  it("extrapolates from last forecast point when target is beyond horizon", () => {
    const forecast = buildStockForecast(risingBars(12), {
      ...HOLT_BY_RANGE.month,
      horizonBars: 3,
    })!
    const far = new Date(forecast.points.at(-1)!.date)
    far.setDate(far.getDate() + 30)
    const price = priceAtDate(forecast, far)
    expect(price).not.toBeNull()
    expect(price!).toBeGreaterThan(forecast.summary.base * 0.5)
  })

  it("priceScenarioAtDate returns base for base scenario", () => {
    const forecast = buildStockForecast(risingBars(12), HOLT_BY_RANGE.month)!
    const target = new Date(forecast.lastDate)
    target.setDate(target.getDate() + 1)
    const base = priceScenarioAtDate(forecast, target, "base")
    expect(base).toBe(priceAtDate(forecast, target))
  })

  it("priceScenarioAtDate scales bear and bull from base", () => {
    const forecast = buildStockForecast(risingBars(12), HOLT_BY_RANGE.month)!
    const target = new Date(forecast.lastDate)
    target.setDate(target.getDate() + 2)
    const base = priceScenarioAtDate(forecast, target, "base")!
    const bear = priceScenarioAtDate(forecast, target, "bear")!
    const bull = priceScenarioAtDate(forecast, target, "bull")!
    expect(bear).toBeLessThan(base)
    expect(bull).toBeGreaterThan(base)
  })

  it("priceAtDate uses history before first bar", () => {
    const forecast = buildStockForecast(risingBars(12), HOLT_BY_RANGE.month)!
    const first = new Date(forecast.points.find((p) => p.kind === "history")!.date)
    first.setFullYear(first.getFullYear() - 1)
    expect(priceAtDate(forecast, first)).not.toBeNull()
  })
})
