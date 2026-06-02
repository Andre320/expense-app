"use client"

import { EmptyState } from "@/components/patterns/empty-state"
import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
import { Skeleton } from "@/components/ui/skeleton"
import { GoalListRow } from "./goal-list-row"
import type { SavingsGoalDto } from "./use-savings-goals"

type GoalListProps = {
  goals: SavingsGoalDto[]
  isPending: boolean
  isError?: boolean
  errorMessage?: string
  onRetry?: () => void
}

export function GoalList({ goals, isPending, isError, errorMessage, onRetry }: GoalListProps) {
  if (isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <QueryErrorPanel
        title="Could not load savings goals"
        message={errorMessage ?? "Goals are unavailable."}
        onRetry={onRetry}
      />
    )
  }

  if (goals.length === 0) {
    return <EmptyState message="No savings goals yet. Add one above." />
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {goals.map((g) => (
        <GoalListRow key={g.id} goal={g} />
      ))}
    </div>
  )
}
