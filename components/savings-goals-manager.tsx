"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import * as React from "react"

import { toast } from "sonner"

import { GoalColorStripe } from "@/components/patterns/goal-color-stripe"

import { InsetPanel } from "@/components/patterns/inset-panel"

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"

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

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { formatMoneyBase } from "@/lib/format-money"

import { movementKindLabel } from "@/lib/savings-movement"

export type SavingsGoalDto = {
  id: string

  name: string

  currency: string

  targetAmount: number | null

  currentAmount: number

  priorityOrder: number

  color: string | null
}

type SavingsMovementDto = {
  id: string

  kind: "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT" | "INITIAL"

  amount: number

  description: string

  occurredAt: string
}

async function fetchGoals(): Promise<SavingsGoalDto[]> {
  const res = await fetch("/api/savings")

  if (!res.ok) throw new Error("goals")

  return res.json()
}

async function fetchGoalMovements(goalId: string): Promise<SavingsMovementDto[]> {
  const res = await fetch(`/api/savings/${goalId}/movements`)

  if (!res.ok) throw new Error("movements")

  return res.json()
}

function GoalCard({ goal }: { goal: SavingsGoalDto }) {
  const qc = useQueryClient()

  const [expanded, setExpanded] = React.useState(false)

  const [amount, setAmount] = React.useState("")

  const [note, setNote] = React.useState("")

  const { data: movements, isPending: movPending } = useQuery({
    queryKey: ["savings-goal-movements", goal.id],

    queryFn: () => fetchGoalMovements(goal.id),

    enabled: expanded,
  })

  const movementMut = useMutation({
    mutationFn: async (kind: "DEPOSIT" | "WITHDRAWAL") => {
      const v = Number(amount)

      if (!Number.isFinite(v) || v <= 0) throw new Error("Invalid amount")

      const res = await fetch(`/api/savings/${goal.id}/movements`, {
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

      qc.invalidateQueries({ queryKey: ["savings"] })

      qc.invalidateQueries({ queryKey: ["savings-goal-movements", goal.id] })

      qc.invalidateQueries({ queryKey: ["analytics"] })
    },

    onError: (e: Error) => toast.error(e.message || "Movement failed"),
  })

  const patchMut = useMutation({
    mutationFn: async (patch: Partial<SavingsGoalDto>) => {
      const res = await fetch(`/api/savings/${goal.id}`, {
        method: "PATCH",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(patch),
      })

      if (!res.ok) throw new Error("fail")

      return res.json()
    },

    onSuccess: () => {
      toast.success("Updated")

      qc.invalidateQueries({ queryKey: ["savings"] })

      qc.invalidateQueries({ queryKey: ["analytics"] })
    },

    onError: () => toast.error("Update failed"),
  })

  const deleteMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/savings/${goal.id}`, { method: "DELETE" })

      if (!res.ok) throw new Error("fail")
    },

    onSuccess: () => {
      toast.success("Goal removed")

      qc.invalidateQueries({ queryKey: ["savings"] })

      qc.invalidateQueries({ queryKey: ["analytics"] })
    },

    onError: () => toast.error("Delete failed"),
  })

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

                      <span>{formatMoneyBase(m.amount, goal.currency || "CRC")}</span>
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

export function SavingsGoalsManager({ embedded }: { embedded?: boolean }) {
  const qc = useQueryClient()

  const { data, isPending } = useQuery({
    queryKey: ["savings"],

    queryFn: fetchGoals,
  })

  const [name, setName] = React.useState("")

  const [target, setTarget] = React.useState("")

  const [alreadySaved, setAlreadySaved] = React.useState("")

  const [priority, setPriority] = React.useState("")

  const [goalCurrency, setGoalCurrency] = React.useState<"CRC" | "USD">("CRC")

  const createMut = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        name: name.trim(),

        currency: goalCurrency,

        targetAmount: target.trim() ? Number(target) : null,

        currentAmount: alreadySaved.trim() ? Number(alreadySaved) : 0,
      }

      if (priority.trim()) body.priorityOrder = Number.parseInt(priority, 10)

      const res = await fetch("/api/savings", {
        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error("fail")

      return res.json()
    },

    onSuccess: () => {
      toast.success("Goal created")

      setName("")

      setTarget("")

      setAlreadySaved("")

      setPriority("")

      setGoalCurrency("CRC")

      qc.invalidateQueries({ queryKey: ["savings"] })

      qc.invalidateQueries({ queryKey: ["analytics"] })
    },

    onError: () => toast.error("Could not create goal"),
  })

  const sorted = React.useMemo(
    () =>
      [...(data ?? [])].sort(
        (a, b) => a.priorityOrder - b.priorityOrder || a.name.localeCompare(b.name),
      ),

    [data],
  )

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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">New goal</CardTitle>

          <CardDescription>
            Set a target and how much you&apos;ve already saved toward it.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="sg-name">Name</Label>

            <Input id="sg-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>

            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={goalCurrency}
              onValueChange={(v) => {
                if (v === "CRC" || v === "USD") setGoalCurrency(v)
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
            <Label htmlFor="sg-target">Target ({goalCurrency})</Label>

            <Input
              id="sg-target"
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="optional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sg-saved">Already saved ({goalCurrency})</Label>

            <Input
              id="sg-saved"
              type="number"
              value={alreadySaved}
              onChange={(e) => setAlreadySaved(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sg-pri">Priority</Label>

            <Input
              id="sg-pri"
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              placeholder="auto"
            />
          </div>

          <Button
            type="button"
            disabled={!name.trim() || createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            Add goal
          </Button>
        </CardContent>
      </Card>

      {isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56 w-full" />

          <Skeleton className="h-56 w-full" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      )}
    </div>
  )
}
