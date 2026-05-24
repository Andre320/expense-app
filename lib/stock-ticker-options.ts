import { DEFAULT_STOCK_TICKER } from "./stock-defaults"

/** Common tickers available in the chart picker (always includes default). */
export const STOCK_TICKER_PRESETS = [
  "SNOW",
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "META",
  "NVDA",
  "TSLA",
  "CRM",
  "PLTR",
] as const

export type StockTickerOption = {
  value: string
  label: string
  group?: "default" | "rsu" | "preset"
}

export function buildStockTickerOptions(extraTickers: string[] = []): StockTickerOption[] {
  const seen = new Set<string>()
  const options: StockTickerOption[] = []

  const add = (ticker: string, group: StockTickerOption["group"]) => {
    const value = ticker.trim().toUpperCase()
    if (!value || seen.has(value)) return
    seen.add(value)
    options.push({ value, label: value, group })
  }

  add(DEFAULT_STOCK_TICKER, "default")

  for (const ticker of extraTickers) {
    add(ticker, "rsu")
  }

  for (const ticker of STOCK_TICKER_PRESETS) {
    add(ticker, "preset")
  }

  return options.sort((a, b) => {
    if (a.value === DEFAULT_STOCK_TICKER) return -1
    if (b.value === DEFAULT_STOCK_TICKER) return 1
    if (a.group === "rsu" && b.group !== "rsu") return -1
    if (b.group === "rsu" && a.group !== "rsu") return 1
    return a.value.localeCompare(b.value)
  })
}

export function normalizeStockTicker(
  value: string | undefined,
  options: StockTickerOption[],
): string {
  const upper = value?.trim().toUpperCase()
  if (upper && options.some((o) => o.value === upper)) return upper
  return options[0]?.value ?? DEFAULT_STOCK_TICKER
}
