"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import { InsetPanel } from "@/components/patterns/inset-panel"
import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoneyBase } from "@/lib/shared/format-money"
import { movementKindLabel } from "@/lib/savings/movement"
import type { SavingsAccountDto, SavingsMovementDto } from "./savings-accounts-manager"

type AccountCardMovementsProps = {
  account: SavingsAccountDto
  expanded: boolean
  onExpandedChange: (open: boolean) => void
  amount: string
  onAmountChange: (value: string) => void
  note: string
  onNoteChange: (value: string) => void
  movementPending: boolean
  onDeposit: () => void
  onWithdraw: () => void
  movements: SavingsMovementDto[] | undefined
  movPending: boolean
  movIsError?: boolean
  movErrorMessage?: string
  onRetryMovements?: () => void
}

export function AccountCardMovements({
  account,
  expanded,
  onExpandedChange,
  amount,
  onAmountChange,
  note,
  onNoteChange,
  movementPending,
  onDeposit,
  onWithdraw,
  movements,
  movPending,
  movIsError,
  movErrorMessage,
  onRetryMovements,
}: AccountCardMovementsProps) {
  return (
    <CardContent className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input
          type="number"
          className="h-8 w-28 text-xs"
          placeholder="Amount"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
        />
        <Input
          className="h-8 min-w-[120px] flex-1 text-xs"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
        />
      </div>
      <Collapsible open={expanded} onOpenChange={onExpandedChange}>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={movementPending}
            onClick={onDeposit}
          >
            Deposit
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
          <CollapsibleTrigger asChild>
            <Button type="button" size="sm" variant="ghost" className="ml-auto text-xs">
              History
              {expanded ? (
                <ChevronUp className="ml-1 h-3 w-3" />
              ) : (
                <ChevronDown className="ml-1 h-3 w-3" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
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
                onRetry={onRetryMovements}
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
                    <span>{formatMoneyBase(m.amount, account.currency || "CRC")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-xs">No movements yet.</p>
            )}
          </InsetPanel>
        </CollapsibleContent>
      </Collapsible>
    </CardContent>
  )
}
