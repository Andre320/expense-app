"use client"

import { GoalColorStripe } from "@/components/patterns/goal-color-stripe"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatMoneyBase } from "@/lib/shared/format-money"
import { GoalListToolbar } from "./goal-list-toolbar"
import { useGoalCard, type SavingsGoalDto } from "./use-savings-goals"

export function GoalListRow({ goal }: { goal: SavingsGoalDto }) {
  const {
    expanded,
    setExpanded,
    amount,
    setAmount,
    note,
    setNote,
    movements,
    movPending,
    movIsError,
    movError,
    refetchMovements,
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

        <GoalListToolbar
          goal={goal}
          expanded={expanded}
          onExpandedChange={setExpanded}
          movementPending={movementMut.isPending}
          onDeposit={() => movementMut.mutate("DEPOSIT")}
          onWithdraw={() => movementMut.mutate("WITHDRAWAL")}
          onPriorityChange={(priorityOrder) => patchMut.mutate({ priorityOrder })}
          deletePending={deleteMut.isPending}
          onDelete={() => deleteMut.mutate()}
          movements={movements}
          movPending={movPending}
          movIsError={movIsError}
          movErrorMessage={movError?.message}
          onRetryMovements={() => void refetchMovements()}
        />
      </CardContent>
    </Card>
  )
}
