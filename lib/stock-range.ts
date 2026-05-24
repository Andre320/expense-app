export type StockRange = "day" | "week" | "month" | "year"

export type HoltParams = {
  alpha: number
  beta: number
  smaShort: number
  smaLong: number
  horizonBars: number
}

export type StockRangeConfig = {
  timeframe: string
  lookbackDays: number
  limit: number
  label: string
  /** @deprecated Use holt.horizonBars — kept for legacy buildTrendChart. */
  forecastFraction: number
  holt: HoltParams
}

export const STOCK_RANGE_CONFIG: Record<StockRange, StockRangeConfig> = {
  day: {
    timeframe: "15Min",
    lookbackDays: 2,
    limit: 200,
    label: "Day",
    forecastFraction: 0.2,
    holt: { alpha: 0.4, beta: 0.2, smaShort: 8, smaLong: 24, horizonBars: 26 },
  },
  week: {
    timeframe: "1Hour",
    lookbackDays: 10,
    limit: 200,
    label: "Week",
    forecastFraction: 0.15,
    holt: { alpha: 0.3, beta: 0.15, smaShort: 12, smaLong: 48, horizonBars: 40 },
  },
  month: {
    timeframe: "1Day",
    lookbackDays: 35,
    limit: 45,
    label: "Month",
    forecastFraction: 0.12,
    holt: { alpha: 0.2, beta: 0.1, smaShort: 5, smaLong: 20, horizonBars: 5 },
  },
  year: {
    timeframe: "1Day",
    lookbackDays: 370,
    limit: 400,
    label: "Year",
    forecastFraction: 0.08,
    holt: { alpha: 0.1, beta: 0.05, smaShort: 20, smaLong: 50, horizonBars: 30 },
  },
}

export const HOLT_BY_RANGE: Record<StockRange, HoltParams> = {
  day: STOCK_RANGE_CONFIG.day.holt,
  week: STOCK_RANGE_CONFIG.week.holt,
  month: STOCK_RANGE_CONFIG.month.holt,
  year: STOCK_RANGE_CONFIG.year.holt,
}

export const STOCK_RANGES: StockRange[] = ["day", "week", "month", "year"]

export function parseStockRange(value: string | null): StockRange {
  if (value === "day" || value === "week" || value === "month" || value === "year") {
    return value
  }
  return "month"
}
