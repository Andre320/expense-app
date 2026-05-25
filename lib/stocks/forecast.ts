import { roundMoney } from "@/lib/shared/currency"
import type { HoltParams } from "@/lib/stocks/range"
export type { HoltParams } from "@/lib/stocks/range"
export { HOLT_BY_RANGE } from "@/lib/stocks/range"

export type PriceBar = {
  date: string
  close: number
}

export type ForecastChartPoint = {
  date: string
  close: number | null
  central: number | null
  lower68: number | null
  upper68: number | null
  lower95: number | null
  upper95: number | null
  kind: "history" | "forecast"
}

export type ForecastSummary = {
  base: number
  bear: number
  bull: number
  driftPctAnn: number
  volatilityPctAnn: number
  momentum: "up" | "down" | "flat"
  rangePositionPct: number
  rSquared: number
  horizonBars: number
  smaShortPct: number | null
  smaLongPct: number | null
}

export type StockForecast = {
  points: ForecastChartPoint[]
  summary: ForecastSummary
  barMs: number
  lastDate: string
}

type HoltState = { level: number; trend: number }

function holtFit(logPrices: number[], alpha: number, beta: number): HoltState {
  if (logPrices.length === 0) return { level: 0, trend: 0 }
  let level = logPrices[0]!
  let trend = logPrices.length > 1 ? logPrices[1]! - logPrices[0]! : 0

  for (let i = 1; i < logPrices.length; i++) {
    const y = logPrices[i]!
    const prevLevel = level
    level = alpha * y + (1 - alpha) * (level + trend)
    trend = beta * (level - prevLevel) + (1 - beta) * trend
  }

  return { level, trend }
}

function holtForecastLog(state: HoltState, stepsAhead: number): number {
  return state.level + stepsAhead * state.trend
}

function logReturns(closes: number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1]!
    const cur = closes[i]!
    if (prev > 0 && cur > 0) out.push(Math.log(cur / prev))
  }
  return out
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(Math.max(0, variance))
}

function sma(values: number[], window: number): number | null {
  if (values.length < window) return null
  const slice = values.slice(-window)
  return slice.reduce((s, v) => s + v, 0) / slice.length
}

function typicalBarMs(bars: PriceBar[]): number {
  if (bars.length < 2) return 86_400_000
  const d0 = new Date(bars[0]!.date).getTime()
  const d1 = new Date(bars[1]!.date).getTime()
  const step = Math.abs(d1 - d0)
  if (step > 0) return step
  const last = new Date(bars.at(-1)!.date).getTime()
  const prev = new Date(bars.at(-2)!.date).getTime()
  return Math.abs(last - prev) || 86_400_000
}

function addMs(isoDate: string, ms: number): string {
  return new Date(new Date(isoDate).getTime() + ms).toISOString()
}

function barsPerYear(barMs: number): number {
  const yearMs = 365.25 * 24 * 60 * 60 * 1000
  return yearMs / barMs
}

function olsLogFallback(logPrices: number[]): HoltState {
  const n = logPrices.length
  if (n < 2) return { level: logPrices[0] ?? 0, trend: 0 }
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0
  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += logPrices[i]!
    sumXY += i * logPrices[i]!
    sumXX += i * i
  }
  const denom = n * sumXX - sumX * sumX
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { level: intercept + slope * (n - 1), trend: slope }
}

function computeRSquared(logPrices: number[], state: HoltState): number {
  if (logPrices.length < 3) return 0
  const mean = logPrices.reduce((s, v) => s + v, 0) / logPrices.length
  let ssTot = 0
  let ssRes = 0
  for (let i = 0; i < logPrices.length; i++) {
    const fitted = state.level + state.trend * (i - (logPrices.length - 1))
    ssTot += (logPrices[i]! - mean) ** 2
    ssRes += (logPrices[i]! - fitted) ** 2
  }
  if (ssTot === 0) return 0
  return roundMoney(Math.max(0, Math.min(1, 1 - ssRes / ssTot)) * 100) / 100
}

function momentumLabel(pctShort: number | null, pctLong: number | null): "up" | "down" | "flat" {
  const threshold = 0.5
  const short = pctShort ?? 0
  const long = pctLong ?? 0
  if (short > threshold && long > -threshold) return "up"
  if (short < -threshold && long < threshold) return "down"
  if (Math.abs(short) < threshold && Math.abs(long) < threshold) return "flat"
  return short >= long ? "up" : "down"
}

export function buildStockForecast(bars: PriceBar[], params: HoltParams): StockForecast | null {
  if (bars.length < 3) return null

  const closes = bars.map((b) => b.close)
  const logPrices = closes.map((c) => (c > 0 ? Math.log(c) : 0))
  const returns = logReturns(closes)
  const sigma = stdDev(returns)
  const barMs = typicalBarMs(bars)
  const horizonBars = Math.max(2, Math.min(params.horizonBars, 60))

  const holt =
    bars.length >= 10 ? holtFit(logPrices, params.alpha, params.beta) : olsLogFallback(logPrices)

  const rSquared = computeRSquared(logPrices, holt)
  const bpy = barsPerYear(barMs)
  const driftPctAnn = roundMoney((Math.exp(holt.trend * bpy) - 1) * 100)
  const volatilityPctAnn = roundMoney(sigma * Math.sqrt(bpy) * 100)

  const lastClose = closes.at(-1)!
  const periodLow = Math.min(...closes)
  const periodHigh = Math.max(...closes)
  const rangePositionPct =
    periodHigh > periodLow
      ? roundMoney(((lastClose - periodLow) / (periodHigh - periodLow)) * 100)
      : 50

  const smaShortVal = sma(closes, params.smaShort)
  const smaLongVal = sma(closes, params.smaLong)
  const smaShortPct =
    smaShortVal != null ? roundMoney(((lastClose - smaShortVal) / smaShortVal) * 100) : null
  const smaLongPct =
    smaLongVal != null ? roundMoney(((lastClose - smaLongVal) / smaLongVal) * 100) : null

  const lastIdx = bars.length - 1
  const points: ForecastChartPoint[] = bars.map((b, i) => {
    const stepsFromEnd = i - lastIdx
    const logF = holtForecastLog(holt, stepsFromEnd)
    const central = roundMoney(Math.exp(logF))
    const h = Math.abs(stepsFromEnd)
    const band68 = sigma * Math.sqrt(Math.max(1, h))
    return {
      date: b.date,
      close: b.close,
      central,
      lower68: roundMoney(central * Math.exp(-band68)),
      upper68: roundMoney(central * Math.exp(band68)),
      lower95: roundMoney(central * Math.exp(-2 * band68)),
      upper95: roundMoney(central * Math.exp(2 * band68)),
      kind: "history",
    }
  })

  const lastDate = bars[lastIdx]!.date
  for (let h = 1; h <= horizonBars; h++) {
    const logF = holtForecastLog(holt, h)
    const central = roundMoney(Math.exp(logF))
    const band68 = sigma * Math.sqrt(h)
    points.push({
      date: addMs(lastDate, h * barMs),
      close: null,
      central,
      lower68: roundMoney(central * Math.exp(-band68)),
      upper68: roundMoney(central * Math.exp(band68)),
      lower95: roundMoney(central * Math.exp(-2 * band68)),
      upper95: roundMoney(central * Math.exp(2 * band68)),
      kind: "forecast",
    })
  }

  const base = points.at(-1)!.central!
  const bear = points.at(-1)!.lower68!
  const bull = points.at(-1)!.upper68!

  return {
    points,
    summary: {
      base,
      bear,
      bull,
      driftPctAnn,
      volatilityPctAnn,
      momentum: momentumLabel(smaShortPct, smaLongPct),
      rangePositionPct,
      rSquared,
      horizonBars,
      smaShortPct,
      smaLongPct,
    },
    barMs,
    lastDate,
  }
}

/** Interpolate/extrapolate central forecast price at a calendar date. */
export function priceAtDate(forecast: StockForecast, targetDate: Date): number | null {
  const targetMs = targetDate.getTime()
  const lastMs = new Date(forecast.lastDate).getTime()
  const steps = (targetMs - lastMs) / forecast.barMs
  if (steps < 0) {
    const hist = forecast.points.filter((p) => p.kind === "history" && p.close != null)
    let best: ForecastChartPoint | null = null
    let bestDiff = Infinity
    for (const p of hist) {
      const diff = Math.abs(new Date(p.date).getTime() - targetMs)
      if (diff < bestDiff) {
        bestDiff = diff
        best = p
      }
    }
    return best?.close ?? null
  }

  const forecastPts = forecast.points.filter((p) => p.kind === "forecast")
  if (forecastPts.length === 0) return forecast.summary.base

  let lower: ForecastChartPoint | null = null
  let upper: ForecastChartPoint | null = null
  for (const p of forecastPts) {
    const t = new Date(p.date).getTime()
    if (t <= targetMs) lower = p
    if (t >= targetMs && !upper) upper = p
  }

  if (lower && upper && lower !== upper) {
    const t0 = new Date(lower.date).getTime()
    const t1 = new Date(upper.date).getTime()
    const w = t1 === t0 ? 0 : (targetMs - t0) / (t1 - t0)
    const c0 = lower.central ?? lower.upper68 ?? 0
    const c1 = upper.central ?? upper.upper68 ?? 0
    return roundMoney(c0 + w * (c1 - c0))
  }

  return lower?.central ?? upper?.central ?? forecast.summary.base
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
