import "server-only"

import { ALPACA_DATA_BASE, alpacaDataHeaders, appendAlpacaFeedParam } from "@/lib/alpaca-data"

const CACHE_TTL_MS = 5 * 60 * 1000

type CacheEntry = {
  priceUsd: number
  asOf: string
  expiresAt: number
}

const quoteCache = new Map<string, CacheEntry>()

export type AlpacaSnapshot = {
  symbol?: string
  latestTrade?: { p?: number; t?: string }
  latestQuote?: { bp?: number; ap?: number; t?: string }
  dailyBar?: { c?: number; t?: string }
  prevDailyBar?: { c?: number; t?: string }
}

export type StockQuoteResult = {
  available: boolean
  ticker: string
  priceUsd?: number
  asOf?: string
  source?: "alpaca"
  error?: string
}

export function priceFromAlpacaSnapshot(
  data: AlpacaSnapshot,
): { priceUsd: number; asOf: string } | null {
  const tradePrice = data.latestTrade?.p
  if (tradePrice != null && tradePrice > 0) {
    return {
      priceUsd: tradePrice,
      asOf: data.latestTrade?.t ?? new Date().toISOString(),
    }
  }

  const dailyClose = data.dailyBar?.c
  if (dailyClose != null && dailyClose > 0) {
    return {
      priceUsd: dailyClose,
      asOf: data.dailyBar?.t ?? new Date().toISOString(),
    }
  }

  const prevClose = data.prevDailyBar?.c
  if (prevClose != null && prevClose > 0) {
    return {
      priceUsd: prevClose,
      asOf: data.prevDailyBar?.t ?? new Date().toISOString(),
    }
  }

  const bid = data.latestQuote?.bp
  const ask = data.latestQuote?.ap
  if (bid != null && ask != null && bid > 0 && ask > 0) {
    return {
      priceUsd: (bid + ask) / 2,
      asOf: data.latestQuote?.t ?? new Date().toISOString(),
    }
  }

  return null
}

export async function getStockQuote(ticker: string): Promise<StockQuoteResult> {
  const symbol = ticker.trim().toUpperCase()
  if (!symbol) {
    return { available: false, ticker: symbol, error: "Invalid ticker" }
  }

  const cached = quoteCache.get(symbol)
  if (cached && cached.expiresAt > Date.now()) {
    return {
      available: true,
      ticker: symbol,
      priceUsd: cached.priceUsd,
      asOf: cached.asOf,
      source: "alpaca",
    }
  }

  const headers = alpacaDataHeaders()
  if (!headers) {
    return {
      available: false,
      ticker: symbol,
      error: "ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY are not configured",
    }
  }

  try {
    const params = new URLSearchParams()
    appendAlpacaFeedParam(params)

    const query = params.size > 0 ? `?${params.toString()}` : ""
    const url = `${ALPACA_DATA_BASE}/v2/stocks/${encodeURIComponent(symbol)}/snapshot${query}`
    const res = await fetch(url, {
      headers,
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      return {
        available: false,
        ticker: symbol,
        error: `Alpaca returned ${res.status}`,
      }
    }

    const data = (await res.json()) as AlpacaSnapshot
    const quote = priceFromAlpacaSnapshot(data)
    if (!quote) {
      return {
        available: false,
        ticker: symbol,
        error: "No quote available for ticker",
      }
    }

    quoteCache.set(symbol, {
      priceUsd: quote.priceUsd,
      asOf: quote.asOf,
      expiresAt: Date.now() + CACHE_TTL_MS,
    })

    return {
      available: true,
      ticker: symbol,
      priceUsd: quote.priceUsd,
      asOf: quote.asOf,
      source: "alpaca",
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Quote fetch failed"
    return { available: false, ticker: symbol, error: msg }
  }
}
