/** @deprecated Use lib/stock-forecast.ts — re-exports for compatibility. */
export type { PriceBar, ForecastChartPoint as ChartPoint } from "./stock-forecast"
export { buildStockForecast, priceAtDate, priceScenarioAtDate } from "./stock-forecast"

import type { PriceBar } from "./stock-forecast"
import { buildStockForecast } from "./stock-forecast"
import { HOLT_BY_RANGE } from "./stock-range"
import { roundMoney } from "./currency"

export type TrendSummary = {
  slopePerBar: number
  projectedEnd: number
  projectedChangePct: number
  forecastSteps: number
}

/** Legacy wrapper — uses month-range Holt params. */
export function buildTrendChart(
  bars: PriceBar[],
  forecastFraction = 0.12,
): { points: ReturnType<typeof buildLegacyPoints>; summary: TrendSummary | null } {
  const params = {
    ...HOLT_BY_RANGE.month,
    horizonBars: Math.max(2, Math.round(bars.length * forecastFraction)),
  }
  const forecast = buildStockForecast(bars, params)
  if (!forecast) {
    return {
      points: bars.map((b) => ({
        date: b.date,
        close: b.close,
        projected: null,
        kind: "history" as const,
      })),
      summary: null,
    }
  }
  return {
    points: buildLegacyPoints(forecast),
    summary: {
      slopePerBar: forecast.summary.driftPctAnn,
      projectedEnd: forecast.summary.base,
      projectedChangePct: roundMoney(
        bars.at(-1)!.close > 0
          ? ((forecast.summary.base - bars.at(-1)!.close) / bars.at(-1)!.close) * 100
          : 0,
      ),
      forecastSteps: forecast.summary.horizonBars,
    },
  }
}

function buildLegacyPoints(forecast: NonNullable<ReturnType<typeof buildStockForecast>>) {
  return forecast.points.map((p) => ({
    date: p.date,
    close: p.close,
    projected: p.central,
    kind: p.kind,
  }))
}
