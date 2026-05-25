import "server-only"

import { subDays } from "date-fns"
import {
  ALPACA_DATA_BASE,
  alpacaDataHeaders,
  appendAlpacaFeedParam,
} from "@/lib/stocks/alpaca-data"
import { parseStockRange, STOCK_RANGE_CONFIG, type StockRange } from "@/lib/stocks/range"
import {
  buildStockForecast,
  type ForecastSummary,
  type ForecastChartPoint,
} from "@/lib/stocks/forecast"

export type StockHistoryBar = {
  date: string
  close: number
}

export type StockHistoryForecast = {
  points: ForecastChartPoint[]
  summary: ForecastSummary
  barMs: number
  lastDate: string
}

export type StockHistoryResult = {
  available: boolean
  ticker: string
  range?: StockRange
  bars?: StockHistoryBar[]
  forecast?: StockHistoryForecast | null
  error?: string
}

type AlpacaBar = {
  t: string
  c: number
}

export async function getStockHistory(
  ticker: string,
  rangeInput: StockRange | string = "month",
): Promise<StockHistoryResult> {
  const range = typeof rangeInput === "string" ? parseStockRange(rangeInput) : rangeInput
  const config = STOCK_RANGE_CONFIG[range]
  const symbol = ticker.trim().toUpperCase()

  if (!symbol) {
    return { available: false, ticker: symbol, error: "Invalid ticker" }
  }

  const headers = alpacaDataHeaders()
  if (!headers) {
    return {
      available: false,
      ticker: symbol,
      error: "ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY are not configured",
    }
  }

  const start = subDays(new Date(), config.lookbackDays).toISOString()

  try {
    const params = new URLSearchParams({
      timeframe: config.timeframe,
      start,
      adjustment: "split",
      sort: "asc",
      limit: String(config.limit),
    })
    appendAlpacaFeedParam(params)

    const url = `${ALPACA_DATA_BASE}/v2/stocks/${encodeURIComponent(symbol)}/bars?${params.toString()}`
    const res = await fetch(url, {
      headers,
      next: { revalidate: range === "day" ? 300 : 3600 },
    })

    if (!res.ok) {
      return {
        available: false,
        ticker: symbol,
        range,
        error: `Alpaca returned ${res.status}`,
      }
    }

    const data = (await res.json()) as { bars?: AlpacaBar[] }
    const bars = (data.bars ?? []).map((bar) => ({
      date: bar.t,
      close: bar.c,
    }))

    if (bars.length === 0) {
      return {
        available: false,
        ticker: symbol,
        range,
        error: "No historical bars for ticker",
      }
    }

    const built = buildStockForecast(bars, config.holt)
    const forecast = built
      ? {
          points: built.points,
          summary: built.summary,
          barMs: built.barMs,
          lastDate: built.lastDate,
        }
      : null

    return { available: true, ticker: symbol, range, bars, forecast }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "History fetch failed"
    return { available: false, ticker: symbol, range, error: msg }
  }
}
