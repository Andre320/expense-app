"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { StockForecastSummary } from "@/components/features/stocks/stock-forecast-summary"
import { StockChartBody } from "@/components/features/stocks/stock-chart-body"
import { StockChartHeader, stockChangePct } from "@/components/features/stocks/stock-chart-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DEFAULT_STOCK_TICKER } from "@/lib/stocks/defaults"
import type { ForecastChartPoint, ForecastSummary } from "@/lib/stocks/forecast"
import type { StockTickerOption } from "@/lib/stocks/ticker-options"
import { fetchJson } from "@/lib/shared/api-error"
import { STOCK_RANGE_CONFIG, type StockRange } from "@/lib/stocks/range"

export type StockHistoryResponse = {
  available: boolean
  ticker: string
  range?: StockRange
  bars?: { date: string; close: number }[]
  forecast?: {
    points: ForecastChartPoint[]
    summary: ForecastSummary
    barMs: number
    lastDate: string
  } | null
  error?: string
}

export async function fetchStockHistory(
  ticker: string,
  range: StockRange,
): Promise<StockHistoryResponse> {
  return fetchJson<StockHistoryResponse>(
    `/api/stocks/history/${encodeURIComponent(ticker)}?range=${range}`,
  )
}

export function StockPriceChart({
  ticker,
  onTickerChange,
  tickerOptions,
  simpleView = false,
  onSimpleViewChange,
  defaultRange = "month",
}: {
  ticker?: string
  onTickerChange?: (ticker: string) => void
  tickerOptions?: StockTickerOption[]
  simpleView?: boolean
  onSimpleViewChange?: (value: boolean) => void
  defaultRange?: StockRange
}) {
  const symbol = (ticker?.trim().toUpperCase() || DEFAULT_STOCK_TICKER).slice(0, 12)
  const [range, setRange] = React.useState<StockRange>(defaultRange)

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["stock-history", symbol, range],
    queryFn: () => fetchStockHistory(symbol, range),
  })

  const bars = React.useMemo(() => data?.bars ?? [], [data?.bars])
  const config = STOCK_RANGE_CONFIG[range]
  const forecastPoints = data?.forecast?.points ?? []
  const summary = data?.forecast?.summary
  const simpleChartPoints = React.useMemo(
    () => bars.map((b) => ({ date: b.date, close: b.close })),
    [bars],
  )
  const hasChartData = simpleView ? simpleChartPoints.length > 0 : forecastPoints.length > 0
  const changePct = stockChangePct(bars)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <StockChartHeader
            symbol={symbol}
            isPending={isPending}
            rangeLabel={config.label}
            latest={bars.at(-1)?.close}
            changePct={changePct}
            simpleView={simpleView}
            summary={summary}
            range={range}
            onRangeChange={setRange}
            onTickerChange={onTickerChange}
            tickerOptions={tickerOptions}
            onSimpleViewChange={onSimpleViewChange}
          />
        </CardHeader>
        <CardContent className="h-[280px] min-h-[280px] pt-2">
          <StockChartBody
            isPending={isPending}
            isError={isError}
            error={error}
            hasChartData={hasChartData}
            simpleView={simpleView}
            range={range}
            simpleChartPoints={simpleChartPoints}
            forecastPoints={forecastPoints}
          />
        </CardContent>
      </Card>

      {!simpleView && summary ? (
        <StockForecastSummary summary={summary} rangeLabel={config.label} />
      ) : null}
    </div>
  )
}
