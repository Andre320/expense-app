"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, CircleHelp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatMoneyBase } from "@/lib/format-money"
import type { ForecastSummary } from "@/lib/stock-forecast"

type Props = {
  summary: ForecastSummary
  rangeLabel: string
  defaultOpen?: boolean
}

const fmt = formatMoneyBase

const STAT_HELP = {
  drift:
    "Annualized trend from Holt exponential smoothing on log(price). Positive means the model expects prices to drift up over a year if recent momentum continues.",
  volatility:
    "Annualized standard deviation of bar-to-bar log returns. Higher values mean larger typical swings; the fan chart width scales with this.",
  momentum:
    "Compares the latest close to short and long simple moving averages (SMA). Up = price above both; down = below both; flat = near both.",
  rangePosition:
    "Where the latest close sits between the period low (0%) and high (100%). 100% means at the top of the selected range.",
  rSquared:
    "How well the Holt trend fits historical log prices (0–1). Closer to 1 = smoother, more consistent trend in the window.",
  bear: "Base Holt forecast minus one standard deviation of log returns at the horizon (~68% of random-walk paths would fall above this).",
  base: "Central Holt linear trend projection at the end of the forecast horizon.",
  bull: "Base Holt forecast plus one standard deviation at the horizon (~68% of paths would fall below this).",
} as const

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex shrink-0 rounded-sm outline-none focus-visible:ring-2"
          aria-label="What does this mean?"
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-left leading-snug">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

function StatCard({
  label,
  value,
  hint,
  help,
}: {
  label: string
  value: string
  hint?: string
  help: string
}) {
  return (
    <div className="border-border bg-muted/20 rounded-xl border p-3">
      <div className="flex items-center gap-1">
        <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
          {label}
        </p>
        <InfoTip text={help} />
      </div>
      <p className="text-foreground mt-1 text-sm font-semibold tabular-nums">{value}</p>
      {hint ? <p className="text-muted-foreground mt-0.5 text-[10px]">{hint}</p> : null}
    </div>
  )
}

function momentumLabel(m: ForecastSummary["momentum"]): string {
  if (m === "up") return "Up"
  if (m === "down") return "Down"
  return "Flat"
}

export function StockForecastSummary({ summary, rangeLabel, defaultOpen = true }: Props) {
  const smaHint =
    summary.smaShortPct != null && summary.smaLongPct != null
      ? `SMA short ${summary.smaShortPct >= 0 ? "+" : ""}${summary.smaShortPct}% · long ${summary.smaLongPct >= 0 ? "+" : ""}${summary.smaLongPct}%`
      : undefined

  return (
    <TooltipProvider delayDuration={200}>
      <Collapsible defaultOpen={defaultOpen} className="group/forecast">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">Pattern analysis</CardTitle>
                <CardDescription>
                  {rangeLabel} horizon · {summary.horizonBars} bars forward · Holt trend +
                  log-return bands
                </CardDescription>
              </div>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 text-xs">
                  <span className="group-data-[state=open]/forecast:hidden">Expand</span>
                  <span className="hidden group-data-[state=open]/forecast:inline">Collapse</span>
                  <ChevronDown className="ml-1 h-3 w-3 group-data-[state=open]/forecast:hidden" />
                  <ChevronUp className="ml-1 hidden h-3 w-3 group-data-[state=open]/forecast:inline" />
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard
                  label="Drift (ann.)"
                  value={`${summary.driftPctAnn >= 0 ? "+" : ""}${summary.driftPctAnn}%`}
                  help={STAT_HELP.drift}
                />
                <StatCard
                  label="Volatility (ann.)"
                  value={`${summary.volatilityPctAnn}%`}
                  help={STAT_HELP.volatility}
                />
                <StatCard
                  label="Momentum"
                  value={momentumLabel(summary.momentum)}
                  hint={smaHint}
                  help={STAT_HELP.momentum}
                />
                <StatCard
                  label="Range position"
                  value={`${summary.rangePositionPct}%`}
                  help={STAT_HELP.rangePosition}
                />
                <StatCard
                  label="Trend fit (R²)"
                  value={summary.rSquared.toFixed(2)}
                  help={STAT_HELP.rSquared}
                />
              </div>

              <div className="border-border bg-muted/10 grid grid-cols-3 gap-2 rounded-xl border p-3 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                      Bear (−1σ)
                    </p>
                    <InfoTip text={STAT_HELP.bear} />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-red-400 tabular-nums">
                    {fmt(summary.bear, "USD")}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                      Base (Holt)
                    </p>
                    <InfoTip text={STAT_HELP.base} />
                  </div>
                  <p className="text-foreground mt-1 text-sm font-semibold tabular-nums">
                    {fmt(summary.base, "USD")}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                      Bull (+1σ)
                    </p>
                    <InfoTip text={STAT_HELP.bull} />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-emerald-400 tabular-nums">
                    {fmt(summary.bull, "USD")}
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground text-[11px]">
                Statistical extrapolation of past returns (Holt trend + log-return volatility
                bands). Not investment advice.
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </TooltipProvider>
  )
}
