"use client"

import { DEFAULT_STOCK_TICKER } from "@/lib/stocks/defaults"
import { PlanForm } from "./plan-form"
import { PlanList } from "./plan-list"
import { useRsuPlansQuery } from "./use-rsu-plans"

export type { RsuPlanDetail, RsuPlanListItem } from "./use-rsu-plans"

export function RsuPlansManager({
  embedded,
  chartTicker = DEFAULT_STOCK_TICKER,
  showForecast = true,
}: {
  embedded?: boolean
  chartTicker?: string
  showForecast?: boolean
}) {
  const { data, isPending } = useRsuPlansQuery()

  return (
    <div className="space-y-6">
      <PlanForm embedded={embedded} />
      <PlanList
        items={data}
        isPending={isPending}
        chartTicker={chartTicker}
        showForecast={showForecast}
      />
    </div>
  )
}
