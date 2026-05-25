"use client"

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { GoalColorStripe } from "@/components/patterns/goal-color-stripe"
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
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoneyBase } from "@/lib/shared/format-money"
import { movementKindLabel } from "@/lib/savings/movement"
import { useGoalCard, type SavingsGoalDto, type SavingsMovementDto } from "./use-savings-goals"

type GoalListProps = {
  goals: SavingsGoalDto[]
  isPending: boolean
}

export function GoalList({ goals, isPending }: GoalListProps) {
  if (isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {goals.map((g) => (
        <GoalCard key={g.id} goal={g} />
      ))}
    </div>
  )
}

function GoalCard({ goal }: { goal: SavingsGoalDto }) {
  const {
    expanded,
    setExpanded,
    amount,
    setAmount,
    note,
    setNote,
    movements,
    movPending,
    movementMut,
    patchMut,
    deleteMut,
  } = useGoalCard(goal)

  return (
    <Card className="overflow-hidden">
      <GoalColorStripe color={goal.color} />

      <CardHeader className="pb-2">
        <CardTitle className="text-base">{goal.name}</CardTitle>
        <CardDescription>
          Priority {goal.priorityOrder} · {goal.currency || "CRC"}
          {goal.targetAmount != null
            ? ` · ${Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))}% to target`
            : ""}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase">Saved</Label>
            <p className="text-sm font-semibold tabular-nums">
              {formatMoneyBase(goal.currentAmount, goal.currency || "CRC")}
            </p>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase">Target ({goal.currency || "CRC"})</Label>
            <Input
              type="number"
              className="h-8 text-xs"
              defaultValue={goal.targetAmount ?? ""}
              key={`t-${goal.id}-${goal.targetAmount}`}
              placeholder="—"
              onBlur={(e) => {
                const raw = e.target.value.trim()
                const next = raw === "" ? null : Number(raw)
                if (next !== null && !Number.isFinite(next)) return
                if (next !== goal.targetAmount) patchMut.mutate({ targetAmount: next })
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Input
            type="number"
            className="h-8 w-28 text-xs"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            className="h-8 min-w-[100px] flex-1 text-xs"
            placeholder="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <div className="flex flex-wrap items-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={movementMut.isPending}
              onClick={() => movementMut.mutate("DEPOSIT")}
            >
              Add
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={movementMut.isPending}
              onClick={() => movementMut.mutate("WITHDRAWAL")}
            >
              Withdraw
            </Button>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase">Priority</Label>
              <Input
                type="number"
                className="h-8 w-20 text-xs"
                defaultValue={goal.priorityOrder}
                key={`p-${goal.id}-${goal.priorityOrder}`}
                onBlur={(e) => {
                  const v = Number.parseInt(e.target.value, 10)
                  if (Number.isFinite(v) && v !== goal.priorityOrder) {
                    patchMut.mutate({ priorityOrder: v })
                  }
                }}
              />
            </div>

            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="text-xs">
                History
                {expanded ? (
                  <ChevronUp className="ml-1 h-3 w-3" />
                ) : (
                  <ChevronDown className="ml-1 h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground ml-auto hover:text-red-400"
                  aria-label="Delete goal"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete goal?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove &ldquo;{goal.name}&rdquo; and its movement history.
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

          <CollapsibleContent>
            <GoalMovementHistory
              movements={movements}
              movPending={movPending}
              currency={goal.currency || "CRC"}
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

function GoalMovementHistory({
  movements,
  movPending,
  currency,
}: {
  movements: SavingsMovementDto[] | undefined
  movPending: boolean
  currency: string
}) {
  return (
    <InsetPanel className="mt-2 p-2">
      {movPending ? (
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3.5 w-3/5" />
        </div>
      ) : movements && movements.length > 0 ? (
        <ul className="space-y-1 text-xs">
          {movements.map((m) => (
            <li key={m.id} className="flex justify-between gap-2 tabular-nums">
              <span className="text-muted-foreground">
                {new Date(m.occurredAt).toLocaleDateString()} · {movementKindLabel(m.kind)}
                {m.description ? ` · ${m.description}` : ""}
              </span>
              <span>{formatMoneyBase(m.amount, currency)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-xs">No movements yet.</p>
      )}
    </InsetPanel>
  )
}
