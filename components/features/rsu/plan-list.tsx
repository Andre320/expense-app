"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoneyBase } from "@/lib/shared/format-money"
import { VestTable } from "./vest-table"
import {
  type RsuPlanListItem,
  useDeleteRsuPlanMutation,
  useNextVestForecast,
  useReceiveVestMutation,
  useRsuPlanDetailQuery,
  useUndoVestMutation,
} from "./use-rsu-plans"

type PlanCardProps = {
  item: RsuPlanListItem
  chartTicker: string
  showForecast: boolean
}

function PlanCard({ item, chartTicker, showForecast }: PlanCardProps) {
  const [vestOpen, setVestOpen] = React.useState(false)
  const [detailsOpen, setDetailsOpen] = React.useState(true)

  const { data: detail, isPending } = useRsuPlanDetailQuery(item.plan.id, vestOpen)
  const receiveMut = useReceiveVestMutation(item.plan.id)
  const undoMut = useUndoVestMutation(item.plan.id)
  const deleteMut = useDeleteRsuPlanMutation(item.plan.id)

  const { plan, summary, quote, valuation } = item
  const { showVestForecast, history, nextPendingVest, vestProjection } = useNextVestForecast(
    item,
    chartTicker,
    showForecast,
  )

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
                <VestTable
                  vests={detail?.vests}
                  isPending={isPending}
                  receivePending={receiveMut.isPending}
                  undoPending={undoMut.isPending}
                  onReceive={(vestId) => receiveMut.mutate(vestId)}
                  onUndo={(vestId) => undoMut.mutate(vestId)}
                />
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

type PlanListProps = {
  items: RsuPlanListItem[] | undefined
  isPending: boolean
  chartTicker: string
  showForecast: boolean
}

export function PlanList({ items, isPending, chartTicker, showForecast }: PlanListProps) {
  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!items || items.length === 0) {
    return <p className="text-muted-foreground text-sm">No RSU plans yet.</p>
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <PlanCard
          key={item.plan.id}
          item={item}
          chartTicker={chartTicker}
          showForecast={showForecast}
        />
      ))}
    </div>
  )
}
