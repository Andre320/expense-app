"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronUp } from "lucide-react"
import { PageIntro } from "@/components/patterns/page-intro"
import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
import { RsuPlansManager } from "@/components/features/rsu/rsu-plans-manager"
import { StockPriceChart } from "@/components/features/stocks/stock-price-chart"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DEFAULT_STOCK_TICKER } from "@/lib/stocks/defaults"
import { buildStockTickerOptions, normalizeStockTicker } from "@/lib/stocks/ticker-options"
import { fetchJson } from "@/lib/shared/api-error"
import type { RsuPlanListItem } from "@/components/features/rsu/use-rsu-plans-queries"

async function fetchRsuTickers(): Promise<string[]> {
  const plans = await fetchJson<RsuPlanListItem[]>("/api/rsu-plans")
  return plans.map((p) => p.plan.ticker)
}

function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  children,
}: {
  title: string
  description?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="group/section">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              {description ? <CardDescription>{description}</CardDescription> : null}
            </div>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 text-xs">
                <span className="group-data-[state=open]/section:hidden">Expand</span>
                <span className="hidden group-data-[state=open]/section:inline">Collapse</span>
                <ChevronDown className="ml-1 h-3 w-3 group-data-[state=open]/section:hidden" />
                <ChevronUp className="ml-1 hidden h-3 w-3 group-data-[state=open]/section:inline" />
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

export default function StocksPage() {
  const [ticker, setTicker] = React.useState(DEFAULT_STOCK_TICKER)
  const [simpleView, setSimpleView] = React.useState(false)

  const {
    data: rsuTickers,
    isError: tickersError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["rsu-plans", "tickers"],
    queryFn: fetchRsuTickers,
  })

  const tickerOptions = React.useMemo(() => buildStockTickerOptions(rsuTickers ?? []), [rsuTickers])

  const symbol = normalizeStockTicker(ticker, tickerOptions)

  const handleTickerChange = React.useCallback(
    (value: string) => {
      setTicker(normalizeStockTicker(value, tickerOptions))
    },
    [tickerOptions],
  )

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Equity compensation"
        title="Stocks"
        description="Company stock chart with Holt trend and volatility bands, plus RSU grant tracking with next-vest projections."
      />

      {tickersError ? (
        <QueryErrorPanel
          title="Could not load RSU tickers"
          message={error?.message ?? "Ticker list is unavailable — chart may still work."}
          onRetry={() => void refetch()}
        />
      ) : null}

      <CollapsibleSection
        title={`${symbol} price${simpleView ? "" : " & forecast"}`}
        description={
          simpleView
            ? "Historical closes only — no trend projection or pattern analysis."
            : "Day, week, month, or year view. Purple line is Holt trend; shaded band is ±1σ from historical log-return volatility."
        }
        defaultOpen
      >
        <StockPriceChart
          ticker={symbol}
          onTickerChange={handleTickerChange}
          tickerOptions={tickerOptions}
          simpleView={simpleView}
          onSimpleViewChange={setSimpleView}
          defaultRange="month"
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="RSU plans"
        description={
          simpleView
            ? "Grant schedules, vest tracking, tax withholding, and live Alpaca valuation."
            : `Grant schedules, vest tracking, tax withholding, live Alpaca valuation, and trend-based next-vest estimates when a plan ticker matches ${symbol}.`
        }
        defaultOpen
      >
        <RsuPlansManager embedded chartTicker={symbol} showForecast={!simpleView} />
      </CollapsibleSection>
    </div>
  )
}
