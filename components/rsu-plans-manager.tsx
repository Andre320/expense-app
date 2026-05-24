"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { InsetPanel } from "@/components/patterns/inset-panel"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoneyBase } from "@/lib/format-money"
import { DEFAULT_STOCK_TICKER } from "@/lib/stock-defaults"
import { priceScenarioAtDate } from "@/lib/stock-forecast"
import { projectVestScenarios } from "@/lib/rsu-projection"
import { fetchStockHistory } from "@/components/stock-price-chart"

export type RsuPlanListItem = {
  plan: {
    id: string
    name: string
    ticker: string
    totalShares: number
    taxWithholdPct: number
    grantDate: string
    vestingPeriodMonths: number
    vestIntervalMonths: number
    vestDayOfMonth: number
  }
  summary: {
    sharesReceived: number
    sharesRemaining: number
    pctComplete: number
    nextVestDate: string | null
    installmentsReceived: number
    installmentsTotal: number
  }
  quote: {
    available: boolean
    priceUsd?: number
    error?: string
  }
  valuation: {
    receivedGrossUsd: number
    receivedNetUsd: number
    receivedCashBonusUsd: number
    pendingGrossUsd: number
    totalGrantGrossUsd: number
  } | null
}

export type RsuPlanDetail = RsuPlanListItem & {
  vests: {
    id: string
    sequence: number
    scheduledDate: string
    shares: number
    status: "PENDING" | "RECEIVED"
    receivedAt: string | null
    sharesWithheld: number | null
    netShares: number | null
    cashBonusUsd: number | null
  }[]
}

async function fetchPlans(): Promise<RsuPlanListItem[]> {
  const res = await fetch("/api/rsu-plans")
  if (!res.ok) throw new Error("plans")
  return res.json()
}

async function fetchPlanDetail(id: string): Promise<RsuPlanDetail> {
  const res = await fetch(`/api/rsu-plans/${id}`)
  if (!res.ok) throw new Error("plan")
  return res.json()
}

function PlanCard({
  item,
  chartTicker = DEFAULT_STOCK_TICKER,
  showForecast = true,
}: {
  item: RsuPlanListItem
  chartTicker?: string
  showForecast?: boolean
}) {
  const qc = useQueryClient()
  const [vestOpen, setVestOpen] = React.useState(false)
  const [detailsOpen, setDetailsOpen] = React.useState(true)

  const { data: detail, isPending } = useQuery({
    queryKey: ["rsu-plans", item.plan.id],
    queryFn: () => fetchPlanDetail(item.plan.id),
    enabled: vestOpen,
  })

  const receiveMut = useMutation({
    mutationFn: async (vestId: string) => {
      const res = await fetch(`/api/rsu-plans/${item.plan.id}/vests/${vestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? "fail")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Vest marked received")
      qc.invalidateQueries({ queryKey: ["rsu-plans"] })
      qc.invalidateQueries({ queryKey: ["rsu-plans", item.plan.id] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const undoMut = useMutation({
    mutationFn: async (vestId: string) => {
      const res = await fetch(`/api/rsu-plans/${item.plan.id}/vests/${vestId}`, {
        method: "PATCH",
      })
      if (!res.ok) throw new Error("fail")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Vest reset to pending")
      qc.invalidateQueries({ queryKey: ["rsu-plans"] })
      qc.invalidateQueries({ queryKey: ["rsu-plans", item.plan.id] })
    },
    onError: () => toast.error("Could not undo"),
  })

  const deleteMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/rsu-plans/${item.plan.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("fail")
    },
    onSuccess: () => {
      toast.success("Plan removed")
      qc.invalidateQueries({ queryKey: ["rsu-plans"] })
    },
    onError: () => toast.error("Delete failed"),
  })

  const { plan, summary, quote, valuation } = item
  const symbol = plan.ticker.trim().toUpperCase()
  const chartSymbol = chartTicker.trim().toUpperCase()
  const showVestForecast = showForecast && symbol === chartSymbol && summary.nextVestDate != null

  const { data: history } = useQuery({
    queryKey: ["stock-history", symbol, "month"],
    queryFn: () => fetchStockHistory(symbol, "month"),
    enabled: showVestForecast,
  })

  const { data: vestDetail } = useQuery({
    queryKey: ["rsu-plans", item.plan.id],
    queryFn: () => fetchPlanDetail(item.plan.id),
    enabled: showVestForecast,
  })

  const nextPendingVest = React.useMemo(() => {
    if (!vestDetail?.vests) return null
    return (
      vestDetail.vests.find(
        (v) =>
          v.status === "PENDING" &&
          summary.nextVestDate &&
          v.scheduledDate.slice(0, 10) === summary.nextVestDate.slice(0, 10),
      ) ?? vestDetail.vests.find((v) => v.status === "PENDING")
    )
  }, [vestDetail, summary.nextVestDate])

  const vestProjection = React.useMemo(() => {
    const forecast = history?.forecast
    if (!forecast || !nextPendingVest || !summary.nextVestDate) return null
    const vestDate = new Date(summary.nextVestDate)
    const bear = priceScenarioAtDate(forecast, vestDate, "bear")
    const base = priceScenarioAtDate(forecast, vestDate, "base")
    const bull = priceScenarioAtDate(forecast, vestDate, "bull")
    if (bear == null || base == null || bull == null) return null
    return projectVestScenarios(nextPendingVest.shares, plan.taxWithholdPct, {
      bear,
      base,
      bull,
    })
  }, [history?.forecast, nextPendingVest, summary.nextVestDate, plan.taxWithholdPct])

  return (
    <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="focus-visible:ring-ring min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-2"
              >
                <CardTitle className="text-base">
                  {plan.name}{" "}
                  <span className="text-muted-foreground font-normal">({plan.ticker})</span>
                </CardTitle>
                <CardDescription className="tabular-nums">
                  {summary.sharesReceived} / {plan.totalShares} shares received (
                  {summary.pctComplete}%)
                  {quote.available && quote.priceUsd
                    ? ` · ${formatMoneyBase(quote.priceUsd, "USD")}/share`
                    : quote.error
                      ? " · quote unavailable"
                      : ""}
                </CardDescription>
              </button>
            </CollapsibleTrigger>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-red-400"
                  aria-label="Delete plan"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete RSU plan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove &ldquo;{plan.name}&rdquo; and its vest schedule.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={deleteMut.isPending}
                    onClick={() => deleteMut.mutate()}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3">
            {valuation ? (
              <div className="grid grid-cols-2 gap-2 text-xs tabular-nums sm:grid-cols-3 lg:grid-cols-5">
                <div>
                  <p className="text-muted-foreground">Received (gross)</p>
                  <p className="font-medium">
                    {formatMoneyBase(valuation.receivedGrossUsd, "USD")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Received (net)</p>
                  <p className="font-medium">{formatMoneyBase(valuation.receivedNetUsd, "USD")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cash bonus</p>
                  <p className="font-medium">
                    {formatMoneyBase(valuation.receivedCashBonusUsd, "USD")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pending</p>
                  <p className="font-medium">{formatMoneyBase(valuation.pendingGrossUsd, "USD")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Grant total</p>
                  <p className="font-medium">
                    {formatMoneyBase(valuation.totalGrantGrossUsd, "USD")}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                Add ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY to .env for live USD valuation.
              </p>
            )}

            {showVestForecast && vestProjection ? (
              <p className="text-muted-foreground text-xs tabular-nums">
                Next vest ({new Date(summary.nextVestDate!).toLocaleDateString()}): base{" "}
                {formatMoneyBase(vestProjection.base.netUsd, "USD")} · bear{" "}
                {formatMoneyBase(vestProjection.bear.netUsd, "USD")} · bull{" "}
                {formatMoneyBase(vestProjection.bull.netUsd, "USD")}
                <span className="block text-[10px]">
                  Holt trend projection at vest date ({nextPendingVest?.shares ?? "—"} gross sh,
                  after withhold)
                </span>
              </p>
            ) : showVestForecast && history && !history.forecast ? (
              <p className="text-muted-foreground text-xs">
                Forecast unavailable for next-vest projection.
              </p>
            ) : null}

            <Collapsible open={vestOpen} onOpenChange={setVestOpen}>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                <span>Tax withhold: {plan.taxWithholdPct}%</span>
                {summary.nextVestDate ? (
                  <span>Next vest: {new Date(summary.nextVestDate).toLocaleDateString()}</span>
                ) : null}
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="ml-auto h-7 text-xs">
                    Vest schedule
                    {vestOpen ? (
                      <ChevronUp className="ml-1 h-3 w-3" />
                    ) : (
                      <ChevronDown className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <InsetPanel className="mt-2 p-2">
                  {isPending ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-4/5" />
                    </div>
                  ) : detail?.vests && detail.vests.length > 0 ? (
                    <ul className="space-y-2 text-xs">
                      {detail.vests.map((v) => (
                        <li
                          key={v.id}
                          className="border-border/50 flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
                        >
                          <div>
                            <span className="font-medium">#{v.sequence}</span>{" "}
                            {new Date(v.scheduledDate).toLocaleDateString()} · {v.shares} sh
                            {v.status === "RECEIVED" && v.netShares != null
                              ? ` → ${v.netShares} whole sh (${v.sharesWithheld} withheld${
                                  v.cashBonusUsd != null && v.cashBonusUsd > 0
                                    ? `, +${formatMoneyBase(v.cashBonusUsd, "USD")} cash`
                                    : ""
                                })`
                              : ""}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={v.status === "RECEIVED" ? "success" : "default"}>
                              {v.status}
                            </Badge>
                            {v.status === "PENDING" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="h-7 text-xs"
                                disabled={receiveMut.isPending}
                                onClick={() => receiveMut.mutate(v.id)}
                              >
                                Mark received
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                disabled={undoMut.isPending}
                                onClick={() => undoMut.mutate(v.id)}
                              >
                                Undo
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-xs">No vest events.</p>
                  )}
                </InsetPanel>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

export function RsuPlansManager({
  embedded,
  chartTicker = DEFAULT_STOCK_TICKER,
  showForecast = true,
}: {
  embedded?: boolean
  chartTicker?: string
  showForecast?: boolean
}) {
  const qc = useQueryClient()
  const { data, isPending } = useQuery({
    queryKey: ["rsu-plans"],
    queryFn: fetchPlans,
  })

  const [name, setName] = React.useState("")
  const [ticker, setTicker] = React.useState("")
  const [totalShares, setTotalShares] = React.useState("100")
  const [grantDate, setGrantDate] = React.useState("")
  const [vestingYears, setVestingYears] = React.useState("4")
  const [vestIntervalMonths, setVestIntervalMonths] = React.useState("3")
  const [vestDay, setVestDay] = React.useState("20")
  const [taxPct, setTaxPct] = React.useState("20")

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/rsu-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          ticker: ticker.trim().toUpperCase(),
          totalShares: Number(totalShares),
          grantDate: grantDate || new Date().toISOString().slice(0, 10),
          vestingPeriodMonths: Number(vestingYears) * 12,
          vestIntervalMonths: Number(vestIntervalMonths),
          vestDayOfMonth: Number(vestDay),
          taxWithholdPct: Number(taxPct),
        }),
      })
      if (!res.ok) throw new Error("fail")
      return res.json()
    },
    onSuccess: () => {
      toast.success("RSU plan created")
      setName("")
      setTicker("")
      qc.invalidateQueries({ queryKey: ["rsu-plans"] })
    },
    onError: () => toast.error("Could not create plan"),
  })

  return (
    <div className="space-y-6">
      <Collapsible defaultOpen={!embedded} className="group/rsu-form">
        <Card className={embedded ? "border-0 bg-transparent shadow-none" : undefined}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">New RSU plan</CardTitle>
                <CardDescription>
                  Fixed share grant with auto-generated vest schedule (e.g. quarterly on day 20).
                </CardDescription>
              </div>
              {embedded ? (
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="h-8 text-xs">
                    Add plan
                    <ChevronDown className="ml-1 h-3 w-3 group-data-[state=open]/rsu-form:hidden" />
                    <ChevronUp className="ml-1 hidden h-3 w-3 group-data-[state=open]/rsu-form:inline" />
                  </Button>
                </CollapsibleTrigger>
              ) : null}
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="rsu-name">Name</Label>
                <Input id="rsu-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsu-ticker">Ticker</Label>
                <Input
                  id="rsu-ticker"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="AAPL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsu-shares">Total shares</Label>
                <Input
                  id="rsu-shares"
                  type="number"
                  value={totalShares}
                  onChange={(e) => setTotalShares(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsu-grant">Grant date</Label>
                <Input
                  id="rsu-grant"
                  type="date"
                  value={grantDate}
                  onChange={(e) => setGrantDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsu-years">Vesting (years)</Label>
                <Input
                  id="rsu-years"
                  type="number"
                  value={vestingYears}
                  onChange={(e) => setVestingYears(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsu-interval">Interval (months)</Label>
                <Input
                  id="rsu-interval"
                  type="number"
                  value={vestIntervalMonths}
                  onChange={(e) => setVestIntervalMonths(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsu-day">Vest day of month</Label>
                <Input
                  id="rsu-day"
                  type="number"
                  value={vestDay}
                  onChange={(e) => setVestDay(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsu-tax">Tax withhold %</Label>
                <Input
                  id="rsu-tax"
                  type="number"
                  value={taxPct}
                  onChange={(e) => setTaxPct(e.target.value)}
                />
              </div>
              <Button
                type="button"
                disabled={!name.trim() || !ticker.trim() || createMut.isPending}
                onClick={() => createMut.mutate()}
              >
                Add plan
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4">
          {data.map((item) => (
            <PlanCard
              key={item.plan.id}
              item={item}
              chartTicker={chartTicker}
              showForecast={showForecast}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No RSU plans yet.</p>
      )}
    </div>
  )
}
