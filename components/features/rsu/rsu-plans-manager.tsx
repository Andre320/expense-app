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
  const { data, isPending, isError, error, refetch } = useRsuPlansQuery()

  return (
    <div className="space-y-6">
      <PlanForm embedded={embedded} />
      <PlanList
        items={data}
        isPending={isPending}
        isError={isError}
        errorMessage={error?.message}
        onRetry={() => void refetch()}
        chartTicker={chartTicker}
        showForecast={showForecast}
      />
    </div>
  )
}
