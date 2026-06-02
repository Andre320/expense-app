"use client"

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { InsetPanel } from "@/components/patterns/inset-panel"
import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoneyBase } from "@/lib/shared/format-money"
import { movementKindLabel } from "@/lib/savings/movement"
import type { SavingsGoalDto, SavingsMovementDto } from "./use-savings-goals"

type GoalListToolbarProps = {
  goal: SavingsGoalDto
  expanded: boolean
  onExpandedChange: (open: boolean) => void
  movementPending: boolean
  onDeposit: () => void
  onWithdraw: () => void
  onPriorityChange: (priorityOrder: number) => void
  deletePending: boolean
  onDelete: () => void
  movements: SavingsMovementDto[] | undefined
  movPending: boolean
  movIsError?: boolean
  movErrorMessage?: string
  onRetryMovements?: () => void
}

export function GoalListToolbar({
  goal,
  expanded,
  onExpandedChange,
  movementPending,
  onDeposit,
  onWithdraw,
  onPriorityChange,
  deletePending,
  onDelete,
  movements,
  movPending,
  movIsError,
  movErrorMessage,
  onRetryMovements,
}: GoalListToolbarProps) {
  return (
    <Collapsible open={expanded} onOpenChange={onExpandedChange}>
      <div className="flex flex-wrap items-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={movementPending}
          onClick={onDeposit}
        >
          Add
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={movementPending}
          onClick={onWithdraw}
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
                onPriorityChange(v)
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
              <AlertDialogAction variant="destructive" disabled={deletePending} onClick={onDelete}>
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
          movIsError={movIsError}
          movErrorMessage={movErrorMessage}
          onRetry={onRetryMovements}
          currency={goal.currency || "CRC"}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}

function GoalMovementHistory({
  movements,
  movPending,
  movIsError,
  movErrorMessage,
  onRetry,
  currency,
}: {
  movements: SavingsMovementDto[] | undefined
  movPending: boolean
  movIsError?: boolean
  movErrorMessage?: string
  onRetry?: () => void
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
      ) : movIsError ? (
        <QueryErrorPanel
          title="Could not load movements"
          message={movErrorMessage ?? "Movement history is unavailable."}
          onRetry={onRetry}
          className="border-0 bg-transparent p-0"
        />
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
