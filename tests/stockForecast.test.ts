import { describe, expect, it } from "vitest"
import { buildStockForecast, priceAtDate } from "@/lib/stock-forecast"
import { HOLT_BY_RANGE } from "@/lib/stock-range"
import { projectVestValue } from "@/lib/rsu-projection"
import { settleVestReceive } from "@/lib/rsu-vesting"

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
})

describe("projectVestValue", () => {
  it("matches settleVestReceive net USD at given price", () => {
    const grossShares = 47.5
    const taxWithholdPct = 22
    const priceUsd = 180.25
    const settlement = settleVestReceive(grossShares, taxWithholdPct, priceUsd)
    const expectedNet =
      Math.round((settlement.netWholeShares * priceUsd + settlement.cashBonusUsd) * 100) / 100
    const projection = projectVestValue(grossShares, taxWithholdPct, priceUsd)
    expect(projection.netUsd).toBe(expectedNet)
    expect(projection.netWholeShares).toBe(settlement.netWholeShares)
    expect(projection.cashBonusUsd).toBe(settlement.cashBonusUsd)
  })
})
