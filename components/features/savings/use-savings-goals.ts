"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"
import { fetchJson, parseApiError } from "@/lib/shared/api-error"

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
  return fetchJson("/api/savings")
}

export async function fetchGoalMovements(goalId: string): Promise<SavingsMovementDto[]> {
  return fetchJson(`/api/savings/${goalId}/movements`)
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
      if (!res.ok) throw await parseApiError(res)
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
    onError: (e: Error) => toast.error(e.message),
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

  const movementsQuery = useQuery({
    queryKey: ["savings-goal-movements", goal.id],
    queryFn: () => fetchGoalMovements(goal.id),
    enabled: expanded,
  })

  const movementMut = useMutation({
    mutationFn: async (kind: "DEPOSIT" | "WITHDRAWAL") => {
      const v = Number(amount)
      if (!Number.isFinite(v) || v <= 0) throw new Error("Enter a positive amount")

      const res = await fetch(`/api/savings/${goal.id}/movements`, {
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
      qc.invalidateQueries({ queryKey: ["savings"] })
      qc.invalidateQueries({ queryKey: ["savings-goal-movements", goal.id] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const patchMut = useMutation({
    mutationFn: async (patch: Partial<SavingsGoalDto>) => {
      const res = await fetch(`/api/savings/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw await parseApiError(res)
      return res.json()
    },
    onSuccess: () => {
      toast.success("Updated")
      qc.invalidateQueries({ queryKey: ["savings"] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/savings/${goal.id}`, { method: "DELETE" })
      if (!res.ok) throw await parseApiError(res)
    },
    onSuccess: () => {
      toast.success("Goal removed")
      qc.invalidateQueries({ queryKey: ["savings"] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return {
    expanded,
    setExpanded,
    amount,
    setAmount,
    note,
    setNote,
    movements: movementsQuery.data,
    movPending: movementsQuery.isPending,
    movIsError: movementsQuery.isError,
    movError: movementsQuery.error,
    refetchMovements: movementsQuery.refetch,
    movementMut,
    patchMut,
    deleteMut,
  }
}
