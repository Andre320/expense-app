"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { StockForecastSummary } from "@/components/stock-forecast-summary"
import { StockTickerSelect } from "@/components/stock-ticker-select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatMoneyBase } from "@/lib/format-money"
import { DEFAULT_STOCK_TICKER } from "@/lib/stock-defaults"
import type { ForecastChartPoint, ForecastSummary } from "@/lib/stock-forecast"
import type { StockTickerOption } from "@/lib/stock-ticker-options"
import { STOCK_RANGE_CONFIG, STOCK_RANGES, type StockRange } from "@/lib/stock-range"

type SimpleChartPoint = { date: string; close: number }

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
  const res = await fetch(`/api/stocks/history/${encodeURIComponent(ticker)}?range=${range}`)
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as StockHistoryResponse
    throw new Error(body.error ?? "Could not load price history")
  }
  return res.json()
}

function formatAxisLabel(date: string, range: StockRange): string {
  const d = new Date(date)
  if (range === "day" || range === "week") {
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function StockChartTooltip({
  active,
  payload,
  label,
  range,
  simpleView,
}: {
  active?: boolean
  payload?: { payload: ForecastChartPoint | SimpleChartPoint }[]
  label?: string
  range: StockRange
  simpleView?: boolean
}) {
  if (!active || !payload?.length || label == null) return null

  const point = payload[0]!.payload
  const close = point.close
  if (close == null) return null

  const rows: { label: string; value: number; color: string; extra?: string }[] = [
    { label: "Close", value: close, color: "#38bdf8" },
  ]

  if (!simpleView && "central" in point) {
    if (point.central != null) {
      rows.push({ label: "Base (Holt)", value: point.central, color: "#a78bfa" })
    }
    if (point.lower68 != null && point.upper68 != null) {
      rows.push({
        label: "68% band",
        value: point.lower68,
        color: "#c4b5fd",
        extra: formatMoneyBase(point.upper68, "USD"),
      })
    }
  }

  return (
    <div className="border-border bg-popover rounded-lg border px-3 py-2.5 text-xs shadow-lg">
      <p className="text-popover-foreground mb-2 font-semibold">
        {formatAxisLabel(String(label), range)}
      </p>
      <ul className="space-y-1">
        {rows.map((row, i) => (
          <li
            key={`${row.label}-${i}`}
            className="flex items-center justify-between gap-4 tabular-nums"
          >
            <span className="text-popover-foreground flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              {row.label}
            </span>
            <span className="text-foreground font-medium">
              {formatMoneyBase(row.value, "USD")}
              {row.extra ? ` – ${row.extra}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
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

  const latest = bars.at(-1)?.close
  const first = bars[0]?.close
  const changePct =
    latest != null && first != null && first > 0 ? ((latest - first) / first) * 100 : null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">{symbol} price</CardTitle>
              <CardDescription className="tabular-nums">
                {isPending
                  ? `Loading ${config.label.toLowerCase()} bars from Alpaca…`
                  : latest != null
                    ? `${formatMoneyBase(latest, "USD")} latest`
                    : "Historical closes"}
                {changePct != null ? (
                  <span className={changePct >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {" "}
                    · {changePct >= 0 ? "+" : ""}
                    {changePct.toFixed(1)}% over range
                  </span>
                ) : null}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
              {onTickerChange && tickerOptions?.length ? (
                <StockTickerSelect
                  value={symbol}
                  onValueChange={onTickerChange}
                  options={tickerOptions}
                />
              ) : null}
              {onSimpleViewChange ? (
                <label className="border-border text-muted-foreground flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-xs">
                  <input
                    type="checkbox"
                    checked={simpleView}
                    onChange={(e) => onSimpleViewChange(e.target.checked)}
                    className="border-input accent-primary size-3.5 rounded"
                  />
                  Simple view
                </label>
              ) : null}
              <ToggleGroup
                type="single"
                value={range}
                onValueChange={(v) => {
                  if (v) setRange(v as StockRange)
                }}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                {STOCK_RANGES.map((r) => (
                  <ToggleGroupItem key={r} value={r} className="px-3 text-xs">
                    {STOCK_RANGE_CONFIG[r].label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
          {!simpleView && summary ? (
            <p className="text-muted-foreground text-xs tabular-nums">
              Holt base at horizon: {formatMoneyBase(summary.base, "USD")} · bear{" "}
              {formatMoneyBase(summary.bear, "USD")} · bull {formatMoneyBase(summary.bull, "USD")}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="h-[280px] min-h-[280px] pt-2">
          {isPending ? (
            <Skeleton className="h-full w-full" />
          ) : isError ? (
            <p className="text-muted-foreground text-sm">
              {(error as Error).message ?? "Chart unavailable"}
            </p>
          ) : !hasChartData ? (
            <p className="text-muted-foreground text-sm">No price data.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
              {simpleView ? (
                <LineChart
                  data={simpleChartPoints}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => formatAxisLabel(String(v), range)}
                    minTickGap={28}
                  />
                  <YAxis
                    stroke="#71717a"
                    tick={{ fontSize: 11 }}
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => `$${v}`}
                    width={52}
                  />
                  <Tooltip
                    content={<StockChartTooltip range={range} simpleView />}
                    cursor={{ stroke: "#52525b", strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="close"
                    name="close"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              ) : (
                <ComposedChart
                  data={forecastPoints}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => formatAxisLabel(String(v), range)}
                    minTickGap={28}
                  />
                  <YAxis
                    stroke="#71717a"
                    tick={{ fontSize: 11 }}
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => `$${v}`}
                    width={52}
                  />
                  <Tooltip
                    content={<StockChartTooltip range={range} />}
                    cursor={{ stroke: "#52525b", strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="upper95"
                    stroke="#a78bfa33"
                    strokeWidth={1}
                    fill="transparent"
                    dot={false}
                    activeDot={false}
                    connectNulls
                    name="Upper 95%"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower95"
                    stroke="#a78bfa33"
                    strokeWidth={1}
                    fill="transparent"
                    dot={false}
                    activeDot={false}
                    connectNulls
                    name="Lower 95%"
                  />
                  <Area
                    type="monotone"
                    dataKey="upper68"
                    stroke="#a78bfa66"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    fill="#a78bfa22"
                    dot={false}
                    activeDot={false}
                    connectNulls
                    name="Upper 68%"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower68"
                    stroke="#a78bfa66"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    fill="hsl(var(--card))"
                    dot={false}
                    activeDot={false}
                    connectNulls
                    name="Lower 68%"
                  />
                  <Line
                    type="monotone"
                    dataKey="close"
                    name="close"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="central"
                    name="central"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {!simpleView && summary ? (
        <StockForecastSummary summary={summary} rangeLabel={config.label} />
      ) : null}
    </div>
  )
}
