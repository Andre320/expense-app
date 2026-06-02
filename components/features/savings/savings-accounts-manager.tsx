"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"
import { EmptyState } from "@/components/patterns/empty-state"
import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatMoneyBase } from "@/lib/shared/format-money"
import { amountToReportingBase, roundMoney } from "@/lib/shared/currency"
import { REPORTING_CURRENCY } from "@/lib/shared/app-currency"
import { fetchJson, parseApiError } from "@/lib/shared/api-error"
import { AccountCard } from "@/components/features/savings/savings-account-card"

export type SavingsAccountDto = {
  id: string
  name: string
  currency: string
  balance: number
  notes: string | null
  position: number
}

export type SavingsMovementDto = {
  id: string
  kind: "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT" | "INITIAL"
  amount: number
  description: string
  occurredAt: string
}

async function fetchAccounts(): Promise<SavingsAccountDto[]> {
  return fetchJson("/api/savings-accounts")
}

export function SavingsAccountsManager({
  reportingCurrency = REPORTING_CURRENCY,
  crcPerUsd = 505,
}: {
  reportingCurrency?: string
  crcPerUsd?: number
}) {
  const qc = useQueryClient()
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["savings-accounts"],
    queryFn: fetchAccounts,
  })

  const [name, setName] = React.useState("")
  const [opening, setOpening] = React.useState("")
  const [accountCurrency, setAccountCurrency] = React.useState<"CRC" | "USD">("CRC")

  const createMut = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        name: name.trim(),
        currency: accountCurrency,
      }
      if (opening.trim()) body.balance = Number(opening)
      const res = await fetch("/api/savings-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw await parseApiError(res)
      return res.json()
    },
    onSuccess: () => {
      toast.success("Account added")
      setName("")
      setOpening("")
      setAccountCurrency("CRC")
      qc.invalidateQueries({ queryKey: ["savings-accounts"] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const totalReporting = React.useMemo(
    () =>
      roundMoney(
        (data ?? []).reduce(
          (s, a) => s + amountToReportingBase(a.balance, a.currency ?? "CRC", crcPerUsd),
          0,
        ),
      ),
    [data, crcPerUsd],
  )

  const hasMixedCurrencies = React.useMemo(() => {
    const cur = new Set((data ?? []).map((a) => a.currency))
    return cur.size > 1
  }, [data])

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold tracking-tight">Savings accounts</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Actual cash in bank accounts and wallets (CRC or USD) — separate from goal earmarks below.
        </p>
      </header>

      <Card className="border-border bg-muted/15">
        <CardHeader className="pb-2">
          <CardDescription>
            Total in accounts{hasMixedCurrencies ? ` (converted to ${reportingCurrency})` : ""}
          </CardDescription>
          <CardTitle className="text-2xl tabular-nums">
            {formatMoneyBase(totalReporting, reportingCurrency)}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">New account</CardTitle>
          <CardDescription>Name, currency, and optional opening balance.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="sa-name">Name</Label>
            <Input id="sa-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={accountCurrency}
              onValueChange={(v) => {
                if (v === "CRC" || v === "USD") setAccountCurrency(v)
              }}
            >
              <ToggleGroupItem value="CRC" aria-label="CRC">
                CRC
              </ToggleGroupItem>
              <ToggleGroupItem value="USD" aria-label="USD">
                USD
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sa-open">Opening balance ({accountCurrency})</Label>
            <Input
              id="sa-open"
              type="number"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              placeholder="0"
            />
          </div>
          <Button
            type="button"
            disabled={!name.trim() || createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            Add account
          </Button>
        </CardContent>
      </Card>

      {isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : isError ? (
        <QueryErrorPanel
          title="Could not load savings accounts"
          message={error?.message ?? "Accounts are unavailable."}
          onRetry={() => void refetch()}
        />
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((a) => (
            <AccountCard key={a.id} account={a} />
          ))}
        </div>
      ) : (
        <EmptyState message="No savings accounts yet. Add one to track real balances." />
      )}
    </div>
  )
}
