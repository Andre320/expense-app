import { roundMoney } from "@/lib/shared/currency"
import type { ForecastChartPoint, StockForecast } from "@/lib/stocks/forecast"

function nearestHistoricalClose(points: ForecastChartPoint[], targetMs: number): number | null {
  let best: ForecastChartPoint | null = null
  let bestDiff = Infinity
  for (const p of points) {
    const diff = Math.abs(new Date(p.date).getTime() - targetMs)
    if (diff < bestDiff) {
      bestDiff = diff
      best = p
    }
  }
  return best?.close ?? null
}

function bracketForecastPoints(forecastPts: ForecastChartPoint[], targetMs: number) {
  let lower: ForecastChartPoint | null = null
  let upper: ForecastChartPoint | null = null
  for (const p of forecastPts) {
    const t = new Date(p.date).getTime()
    if (t <= targetMs) lower = p
    if (t >= targetMs && !upper) upper = p
  }
  return { lower, upper }
}

function interpolateBetweenPoints(
  lower: ForecastChartPoint,
  upper: ForecastChartPoint,
  targetMs: number,
): number {
  const t0 = new Date(lower.date).getTime()
  const t1 = new Date(upper.date).getTime()
  const w = t1 === t0 ? 0 : (targetMs - t0) / (t1 - t0)
  const c0 = lower.central ?? lower.upper68 ?? 0
  const c1 = upper.central ?? upper.upper68 ?? 0
  return roundMoney(c0 + w * (c1 - c0))
}

function interpolateForecastPrice(
  forecastPts: ForecastChartPoint[],
  targetMs: number,
  fallback: number,
): number {
  const { lower, upper } = bracketForecastPoints(forecastPts, targetMs)

  if (lower && upper && lower !== upper) {
    return interpolateBetweenPoints(lower, upper, targetMs)
  }

  return lower?.central ?? upper?.central ?? fallback
}

/** Interpolate/extrapolate central forecast price at a calendar date. */
export function priceAtDate(forecast: StockForecast, targetDate: Date): number | null {
  const targetMs = targetDate.getTime()
  const lastMs = new Date(forecast.lastDate).getTime()
  const steps = (targetMs - lastMs) / forecast.barMs

  if (steps < 0) {
    const hist = forecast.points.filter((p) => p.kind === "history" && p.close != null)
    return nearestHistoricalClose(hist, targetMs)
  }

  const forecastPts = forecast.points.filter((p) => p.kind === "forecast")
  if (forecastPts.length === 0) return forecast.summary.base

  return interpolateForecastPrice(forecastPts, targetMs, forecast.summary.base)
}

export function priceScenarioAtDate(
  forecast: StockForecast,
  targetDate: Date,
  scenario: "bear" | "base" | "bull",
): number | null {
  const base = priceAtDate(forecast, targetDate)
  if (base == null) return null
  if (scenario === "base") return base

  const ratio =
    scenario === "bear"
      ? forecast.summary.bear / forecast.summary.base
      : forecast.summary.bull / forecast.summary.base

  return roundMoney(base * ratio)
}
