"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { SortingState } from "@tanstack/react-table"
import { format } from "date-fns"
import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { REPORTING_CURRENCY } from "@/lib/shared/app-currency"

export type Category = { id: string; name: string; kind: "INCOME" | "EXPENSE" }

export type Tx = {
  id: string
  occurredAt: string
  kind: "INCOME" | "EXPENSE"
  description: string
  category: { id: string; name: string } | null
  amountOriginal: number
  currencyCode: string
  amountBase: number
  amountQuote: number
  tags?: { id: string; name: string }[]
}

const formSchema = z.object({
  occurredAt: z.string().min(1),
  kind: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  amountOriginal: z.number().positive(),
  currencyCode: z.string().min(3).max(3),
  tagNames: z.string().optional(),
})

export type FormValues = z.infer<typeof formSchema>

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories")
  if (!res.ok) throw new Error("categories")
  return res.json()
}

async function fetchTags(): Promise<{ id: string; name: string }[]> {
  const res = await fetch("/api/tags")
  if (!res.ok) throw new Error("tags")
  return res.json()
}

async function fetchTxs(params: URLSearchParams) {
  const res = await fetch(`/api/transactions?${params.toString()}`)
  if (!res.ok) throw new Error("tx")
  return res.json() as Promise<{ items: Tx[]; total: number; page: number; pageSize: number }>
}

export function useTransactionsPage() {
  const qc = useQueryClient()
  const [page, setPage] = React.useState(1)
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "occurredAt", desc: true }])
  const [kindFilter, setKindFilter] = React.useState("")
  const [q, setQ] = React.useState("")
  const [debouncedQ, setDebouncedQ] = React.useState("")

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const sort = sorting[0]
  const sortBy = sort?.id ?? "occurredAt"
  const sortDir = sort?.desc ? "desc" : "asc"

  const params = React.useMemo(() => {
    const p = new URLSearchParams({
      page: String(page),
      pageSize: "15",
      sortBy,
      sortDir,
    })
    if (kindFilter) p.set("kind", kindFilter)
    if (debouncedQ) p.set("q", debouncedQ)
    return p
  }, [page, sortBy, sortDir, kindFilter, debouncedQ])

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  })

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  })

  const { data, isPending } = useQuery({
    queryKey: ["transactions", params.toString()],
    queryFn: () => fetchTxs(params),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      occurredAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      kind: "EXPENSE",
      description: "",
      categoryId: "",
      amountOriginal: 1,
      currencyCode: REPORTING_CURRENCY,
      tagNames: "",
    },
  })

  React.useEffect(() => {
    form.setValue("currencyCode", REPORTING_CURRENCY)
  }, [form])

  const watchedKind = useWatch({ control: form.control, name: "kind" }) ?? "EXPENSE"
  const filteredCats = React.useMemo(
    () => (categories ?? []).filter((c) => c.kind === watchedKind),
    [categories, watchedKind],
  )

  const createMut = useMutation({
    mutationFn: async (body: FormValues) => {
      const names = [
        ...new Set(
          (body.tagNames ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ]
      const tagIds: string[] = []
      for (const name of names) {
        const tr = await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        })
        if (!tr.ok) throw new Error("Tag failed")
        const tj = (await tr.json()) as { id: string }
        tagIds.push(tj.id)
      }
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occurredAt: body.occurredAt,
          kind: body.kind,
          description: body.description,
          categoryId: body.categoryId || null,
          amountOriginal: body.amountOriginal,
          currencyCode: body.currencyCode,
          tagIds,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.formErrors?.join?.() ?? "Save failed")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Entry saved")
      qc.invalidateQueries({ queryKey: ["transactions"] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
      qc.invalidateQueries({ queryKey: ["tags"] })
      form.reset({
        ...form.getValues(),
        description: "",
        amountOriginal: 1,
        tagNames: "",
      })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
    },
    onSuccess: () => {
      toast.success("Removed")
      qc.invalidateQueries({ queryKey: ["transactions"] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
    },
    onError: () => toast.error("Could not delete"),
  })

  const setKindFilterWithReset = React.useCallback((value: string) => {
    setKindFilter(value)
    setPage(1)
  }, [])

  const setQWithReset = React.useCallback((value: string) => {
    setQ(value)
    setPage(1)
  }, [])

  const setSortingWithReset = React.useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      setSorting(updater)
      setPage(1)
    },
    [],
  )

  return {
    page,
    setPage,
    sorting,
    setSorting: setSortingWithReset,
    kindFilter,
    setKindFilter: setKindFilterWithReset,
    q,
    setQ: setQWithReset,
    data,
    isPending,
    form,
    filteredCats,
    tags,
    createMut,
    deleteMut,
  }
}
