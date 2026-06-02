"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"
import { fetchJson, parseApiError } from "@/lib/shared/api-error"
import { Card } from "@/components/ui/card"
import { AccountCardHeader } from "./account-card-header"
import { AccountCardMovements } from "./account-card-movements"
import type { SavingsAccountDto, SavingsMovementDto } from "./savings-accounts-manager"

async function fetchMovements(accountId: string): Promise<SavingsMovementDto[]> {
  return fetchJson(`/api/savings-accounts/${accountId}/movements`)
}

export function AccountCard({ account }: { account: SavingsAccountDto }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = React.useState(false)
  const [amount, setAmount] = React.useState("")
  const [note, setNote] = React.useState("")

  const movementsQuery = useQuery({
    queryKey: ["savings-account-movements", account.id],
    queryFn: () => fetchMovements(account.id),
    enabled: expanded,
  })

  const movementMut = useMutation({
    mutationFn: async (kind: "DEPOSIT" | "WITHDRAWAL") => {
      const v = Number(amount)
      if (!Number.isFinite(v) || v <= 0) throw new Error("Enter a positive amount")
      const res = await fetch(`/api/savings-accounts/${account.id}/movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          amount: v,
          description: note.trim(),
        }),
      })
      if (!res.ok) throw await parseApiError(res)
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
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/savings-accounts/${account.id}`, { method: "DELETE" })
      if (!res.ok) throw await parseApiError(res)
    },
    onSuccess: () => {
      toast.success("Account removed")
      qc.invalidateQueries({ queryKey: ["savings-accounts"] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Card>
      <AccountCardHeader
        account={account}
        deletePending={deleteMut.isPending}
        onDelete={() => deleteMut.mutate()}
      />
      <AccountCardMovements
        account={account}
        expanded={expanded}
        onExpandedChange={setExpanded}
        amount={amount}
        onAmountChange={setAmount}
        note={note}
        onNoteChange={setNote}
        movementPending={movementMut.isPending}
        onDeposit={() => movementMut.mutate("DEPOSIT")}
        onWithdraw={() => movementMut.mutate("WITHDRAWAL")}
        movements={movementsQuery.data}
        movPending={movementsQuery.isPending}
        movIsError={movementsQuery.isError}
        movErrorMessage={movementsQuery.error?.message}
        onRetryMovements={() => void movementsQuery.refetch()}
      />
    </Card>
  )
}
