"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

export type SavingsGoalDto = {
  id: string
  name: string
  currency: string
  targetAmount: number | null
  currentAmount: number
  priorityOrder: number
  color: string | null
}

export type SavingsMovementDto = {
  id: string
  kind: "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT" | "INITIAL"
  amount: number
  description: string
  occurredAt: string
}

export async function fetchGoals(): Promise<SavingsGoalDto[]> {
  const res = await fetch("/api/savings")
  if (!res.ok) throw new Error("goals")
  return res.json()
}

export async function fetchGoalMovements(goalId: string): Promise<SavingsMovementDto[]> {
  const res = await fetch(`/api/savings/${goalId}/movements`)
  if (!res.ok) throw new Error("movements")
  return res.json()
}

export function useSavingsGoalsQuery() {
  return useQuery({
    queryKey: ["savings"],
    queryFn: fetchGoals,
  })
}

export function useCreateGoalForm() {
  const qc = useQueryClient()
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

  return {
    name,
    setName,
    target,
    setTarget,
    alreadySaved,
    setAlreadySaved,
    priority,
    setPriority,
    goalCurrency,
    setGoalCurrency,
    createMut,
  }
}

export function useSortedGoals(data: SavingsGoalDto[] | undefined) {
  return React.useMemo(
    () =>
      [...(data ?? [])].sort(
        (a, b) => a.priorityOrder - b.priorityOrder || a.name.localeCompare(b.name),
      ),
    [data],
  )
}

export function useGoalCard(goal: SavingsGoalDto) {
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

  return {
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
  }
}
