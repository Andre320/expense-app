import { roundMoney } from "@/lib/shared/currency"

export type HoltState = { level: number; trend: number }

export type PriceBar = {
  date: string
  close: number
}

export function holtFit(logPrices: number[], alpha: number, beta: number): HoltState {
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

export function holtForecastLog(state: HoltState, stepsAhead: number): number {
  return state.level + stepsAhead * state.trend
}

export function logReturns(closes: number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1]!
    const cur = closes[i]!
    if (prev > 0 && cur > 0) out.push(Math.log(cur / prev))
  }
  return out
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(Math.max(0, variance))
}

export function sma(values: number[], window: number): number | null {
  if (values.length < window) return null
  const slice = values.slice(-window)
  return slice.reduce((s, v) => s + v, 0) / slice.length
}

export function typicalBarMs(bars: PriceBar[]): number {
  if (bars.length < 2) return 86_400_000
  const d0 = new Date(bars[0]!.date).getTime()
  const d1 = new Date(bars[1]!.date).getTime()
  const step = Math.abs(d1 - d0)
  if (step > 0) return step
  const last = new Date(bars.at(-1)!.date).getTime()
  const prev = new Date(bars.at(-2)!.date).getTime()
  return Math.abs(last - prev) || 86_400_000
}

export function addMs(isoDate: string, ms: number): string {
  return new Date(new Date(isoDate).getTime() + ms).toISOString()
}

export function barsPerYear(barMs: number): number {
  const yearMs = 365.25 * 24 * 60 * 60 * 1000
  return yearMs / barMs
}

export function olsLogFallback(logPrices: number[]): HoltState {
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

export function computeRSquared(logPrices: number[], state: HoltState): number {
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

export function momentumLabel(
  pctShort: number | null,
  pctLong: number | null,
): "up" | "down" | "flat" {
  const threshold = 0.5
  const short = pctShort ?? 0
  const long = pctLong ?? 0
  if (short > threshold && long > -threshold) return "up"
  if (short < -threshold && long < threshold) return "down"
  if (Math.abs(short) < threshold && Math.abs(long) < threshold) return "flat"
  return short >= long ? "up" : "down"
}
