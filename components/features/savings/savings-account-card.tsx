"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoneyBase } from "@/lib/shared/format-money"
import { movementKindLabel } from "@/lib/savings/movement"
import type { SavingsAccountDto, SavingsMovementDto } from "./savings-accounts-manager"

async function fetchMovements(accountId: string): Promise<SavingsMovementDto[]> {
  const res = await fetch(`/api/savings-accounts/${accountId}/movements`)
  if (!res.ok) throw new Error("movements")
  return res.json()
}

export function AccountCard({ account }: { account: SavingsAccountDto }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = React.useState(false)
  const [amount, setAmount] = React.useState("")
  const [note, setNote] = React.useState("")

  const { data: movements, isPending: movPending } = useQuery({
    queryKey: ["savings-account-movements", account.id],
    queryFn: () => fetchMovements(account.id),
    enabled: expanded,
  })

  const movementMut = useMutation({
    mutationFn: async (kind: "DEPOSIT" | "WITHDRAWAL") => {
      const v = Number(amount)
      if (!Number.isFinite(v) || v <= 0) throw new Error("Invalid amount")
      const res = await fetch(`/api/savings-accounts/${account.id}/movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          amount: v,
          description: note.trim(),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? "fail")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Recorded")
      setAmount("")
      setNote("")
      qc.invalidateQueries({ queryKey: ["savings-accounts"] })
      qc.invalidateQueries({ queryKey: ["savings-account-movements", account.id] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
    },
    onError: (e: Error) => toast.error(e.message || "Movement failed"),
  })

  const deleteMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/savings-accounts/${account.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("fail")
    },
    onSuccess: () => {
      toast.success("Account removed")
      qc.invalidateQueries({ queryKey: ["savings-accounts"] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
    },
    onError: () => toast.error("Delete failed"),
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{account.name}</CardTitle>
            <CardDescription className="tabular-nums">
              {formatMoneyBase(account.balance, account.currency || "CRC")} ·{" "}
              {account.currency || "CRC"}
            </CardDescription>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-red-400"
                aria-label="Delete account"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove &ldquo;{account.name}&rdquo; and its movement
                  history.
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
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Input
            type="number"
            className="h-8 w-28 text-xs"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            className="h-8 min-w-[120px] flex-1 text-xs"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={movementMut.isPending}
              onClick={() => movementMut.mutate("DEPOSIT")}
            >
              Deposit
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
    </Card>
  )
}
