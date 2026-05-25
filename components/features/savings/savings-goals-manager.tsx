"use client"

import { GoalForm } from "./goal-form"
import { GoalList } from "./goal-list"
import { useCreateGoalForm, useSavingsGoalsQuery, useSortedGoals } from "./use-savings-goals"

export type { SavingsGoalDto } from "./use-savings-goals"

export function SavingsGoalsManager({ embedded }: { embedded?: boolean }) {
  const { data, isPending } = useSavingsGoalsQuery()
  const sorted = useSortedGoals(data)
  const form = useCreateGoalForm()

  return (
    <div className="space-y-6">
      {!embedded ? (
        <header>
          <h2 className="text-lg font-semibold tracking-tight">Savings goals</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Earmarked targets in CRC or USD — lower priority number is funded first in the forecast.
          </p>
        </header>
      ) : null}

      <GoalForm
        name={form.name}
        onNameChange={form.setName}
        target={form.target}
        onTargetChange={form.setTarget}
        alreadySaved={form.alreadySaved}
        onAlreadySavedChange={form.setAlreadySaved}
        priority={form.priority}
        onPriorityChange={form.setPriority}
        goalCurrency={form.goalCurrency}
        onGoalCurrencyChange={form.setGoalCurrency}
        createMut={form.createMut}
      />

      <GoalList goals={sorted} isPending={isPending} />
    </div>
  )
}
