"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"
import type { IncomeBonusDto } from "@/components/features/income/income-bonus-types"
import {
  INCOME_BONUSES_QUERY_KEY,
  sortIncomeBonuses,
} from "@/components/features/income/income-bonuses-helpers"
import { fetchJson, parseApiError } from "@/lib/shared/api-error"

async function fetchBonuses(): Promise<IncomeBonusDto[]> {
  return fetchJson("/api/income-bonuses")
}

export function useIncomeBonuses() {
  const qc = useQueryClient()
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: INCOME_BONUSES_QUERY_KEY,
    queryFn: fetchBonuses,
  })

  const [name, setName] = React.useState("")
  const [gross, setGross] = React.useState("")
  const [currency, setCurrency] = React.useState<"CRC" | "USD">("CRC")
  const [selectedMonths, setSelectedMonths] = React.useState<number[]>([])

  function toggleMonth(m: number) {
    setSelectedMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b),
    )
  }

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/income-bonuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          grossAmount: Number(gross),
          grossCurrency: currency,
          months: selectedMonths,
        }),
      })
      if (!res.ok) throw await parseApiError(res)
      return res.json()
    },
    onSuccess: () => {
      toast.success("Bonus added")
      setName("")
      setGross("")
      setCurrency("CRC")
      setSelectedMonths([])
      qc.invalidateQueries({ queryKey: INCOME_BONUSES_QUERY_KEY })
      qc.invalidateQueries({ queryKey: ["analytics"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/income-bonuses/${id}`, { method: "DELETE" })
      if (!res.ok) throw await parseApiError(res)
    },
    onSuccess: () => {
      toast.success("Bonus removed")
      qc.invalidateQueries({ queryKey: INCOME_BONUSES_QUERY_KEY })
      qc.invalidateQueries({ queryKey: ["analytics"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const sorted = React.useMemo(() => sortIncomeBonuses(data), [data])

  return {
    sorted,
    isPending,
    isError,
    error,
    refetch,
    name,
    setName,
    gross,
    setGross,
    currency,
    setCurrency,
    selectedMonths,
    toggleMonth,
    createMut,
    deleteMut,
  }
}
