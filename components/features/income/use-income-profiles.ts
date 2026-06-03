"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"
import {
  INCOME_PROFILES_QUERY_KEY,
  type IncomeProfileDto,
} from "@/components/features/income/income-profile-types"
import { fetchJson, parseApiError } from "@/lib/shared/api-error"

async function fetchProfiles(): Promise<IncomeProfileDto[]> {
  return fetchJson("/api/income-profiles")
}

export function useIncomeProfiles() {
  const qc = useQueryClient()
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: INCOME_PROFILES_QUERY_KEY,
    queryFn: fetchProfiles,
  })

  const [label, setLabel] = React.useState("")
  const [effectiveFrom, setEffectiveFrom] = React.useState("")
  const [effectiveTo, setEffectiveTo] = React.useState("")
  const [gross, setGross] = React.useState("")
  const [currency, setCurrency] = React.useState<"CRC" | "USD">("CRC")
  const [period, setPeriod] = React.useState<"MONTHLY" | "BIWEEKLY">("MONTHLY")

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/income-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          effectiveFrom,
          effectiveTo: effectiveTo.trim() ? effectiveTo : null,
          crSalaryGross: Number(gross),
          crSalaryCurrency: currency,
          crPayPeriod: period,
        }),
      })
      if (!res.ok) throw await parseApiError(res)
      return res.json()
    },
    onSuccess: () => {
      toast.success("Income profile added")
      setLabel("")
      setEffectiveFrom("")
      setEffectiveTo("")
      setGross("")
      qc.invalidateQueries({ queryKey: INCOME_PROFILES_QUERY_KEY })
      qc.invalidateQueries({ queryKey: ["settings"] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/income-profiles/${id}`, { method: "DELETE" })
      if (!res.ok) throw await parseApiError(res)
    },
    onSuccess: () => {
      toast.success("Profile removed")
      qc.invalidateQueries({ queryKey: INCOME_PROFILES_QUERY_KEY })
      qc.invalidateQueries({ queryKey: ["settings"] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const sorted = React.useMemo(
    () => [...(data ?? [])].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom)),
    [data],
  )

  return {
    sorted,
    isPending,
    isError,
    error,
    refetch,
    label,
    setLabel,
    effectiveFrom,
    setEffectiveFrom,
    effectiveTo,
    setEffectiveTo,
    gross,
    setGross,
    currency,
    setCurrency,
    period,
    setPeriod,
    createMut,
    deleteMut,
  }
}
