"use client"

import { EmptyState } from "@/components/patterns/empty-state"
import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
import { Skeleton } from "@/components/ui/skeleton"
import { PlanListCard } from "./plan-list-card"
import type { RsuPlanListItem } from "./use-rsu-plans"

type PlanListProps = {
  items: RsuPlanListItem[] | undefined
  isPending: boolean
  isError?: boolean
  errorMessage?: string
  onRetry?: () => void
  chartTicker: string
  showForecast: boolean
}

export function PlanList({
  items,
  isPending,
  isError,
  errorMessage,
  onRetry,
  chartTicker,
  showForecast,
}: PlanListProps) {
  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <QueryErrorPanel
        title="Could not load RSU plans"
        message={errorMessage ?? "Plans are unavailable."}
        onRetry={onRetry}
      />
    )
  }

  if (!items || items.length === 0) {
    return <EmptyState message="No RSU plans yet. Add one above." />
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <PlanListCard
          key={item.plan.id}
          item={item}
          chartTicker={chartTicker}
          showForecast={showForecast}
        />
      ))}
    </div>
  )
}
