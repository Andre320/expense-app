import { StockTickerSelect } from "@/components/features/stocks/stock-ticker-select"
import { CardDescription, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatMoneyBase } from "@/lib/shared/format-money"
import type { ForecastSummary } from "@/lib/stocks/forecast"
import type { StockTickerOption } from "@/lib/stocks/ticker-options"
import { STOCK_RANGE_CONFIG, STOCK_RANGES, type StockRange } from "@/lib/stocks/range"

type StockChartHeaderProps = {
  symbol: string
  isPending: boolean
  rangeLabel: string
  latest: number | undefined
  changePct: number | null
  simpleView: boolean
  summary: ForecastSummary | undefined
  range: StockRange
  onRangeChange: (range: StockRange) => void
  onTickerChange?: (ticker: string) => void
  tickerOptions?: StockTickerOption[]
  onSimpleViewChange?: (value: boolean) => void
}

function priceDescription(
  isPending: boolean,
  rangeLabel: string,
  latest: number | undefined,
  changePct: number | null,
) {
  if (isPending) return `Loading ${rangeLabel.toLowerCase()} bars from Alpaca…`
  const base = latest != null ? `${formatMoneyBase(latest, "USD")} latest` : "Historical closes"
  if (changePct == null) return base
  const sign = changePct >= 0 ? "+" : ""
  const colorClass = changePct >= 0 ? "text-emerald-400" : "text-red-400"
  return (
    <>
      {base}
      <span className={colorClass}>
        {" "}
        · {sign}
        {changePct.toFixed(1)}% over range
      </span>
    </>
  )
}

export function StockChartHeader({
  symbol,
  isPending,
  rangeLabel,
  latest,
  changePct,
  simpleView,
  summary,
  range,
  onRangeChange,
  onTickerChange,
  tickerOptions,
  onSimpleViewChange,
}: StockChartHeaderProps) {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base">{symbol} price</CardTitle>
          <CardDescription className="tabular-nums">
            {priceDescription(isPending, rangeLabel, latest, changePct)}
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
              if (v) onRangeChange(v as StockRange)
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
    </>
  )
}

export function stockChangePct(bars: { close: number }[]): number | null {
  const latest = bars.at(-1)?.close
  const first = bars[0]?.close
  if (latest == null || first == null || first <= 0) return null
  return ((latest - first) / first) * 100
}
