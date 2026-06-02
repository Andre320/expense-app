import { roundMoney } from "@/lib/shared/currency"
import {
  addMs,
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
  type PriceBar,
} from "@/lib/stocks/forecast-holt"
import type { HoltParams } from "@/lib/stocks/range"

export type { HoltParams } from "@/lib/stocks/range"
export { HOLT_BY_RANGE } from "@/lib/stocks/range"
export type { PriceBar } from "@/lib/stocks/forecast-holt"

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

export { priceAtDate, priceScenarioAtDate } from "@/lib/stocks/forecast-price"
