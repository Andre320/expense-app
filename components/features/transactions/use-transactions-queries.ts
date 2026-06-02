"use client"

import { useQuery } from "@tanstack/react-query"
import type { SortingState } from "@tanstack/react-table"
import { format } from "date-fns"
import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { fetchJson } from "@/lib/shared/api-error"
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
  return fetchJson("/api/categories")
}

async function fetchTags(): Promise<{ id: string; name: string }[]> {
  return fetchJson("/api/tags")
}

async function fetchTxs(params: URLSearchParams) {
  return fetchJson<{ items: Tx[]; total: number; page: number; pageSize: number }>(
    `/api/transactions?${params.toString()}`,
  )
}

export type TxSearchParamsInput = {
  page: number
  sortBy: string
  sortDir: "asc" | "desc"
  kindFilter?: string
  debouncedQ?: string
}

export function buildTxSearchParams(input: TxSearchParamsInput): URLSearchParams {
  const p = new URLSearchParams({
    page: String(input.page),
    pageSize: "15",
    sortBy: input.sortBy,
    sortDir: input.sortDir,
  })
  if (input.kindFilter) p.set("kind", input.kindFilter)
  if (input.debouncedQ) p.set("q", input.debouncedQ)
  return p
}

export function useTransactionQueries() {
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

  const params = React.useMemo(
    () =>
      buildTxSearchParams({
        page,
        sortBy,
        sortDir,
        kindFilter: kindFilter || undefined,
        debouncedQ: debouncedQ || undefined,
      }),
    [page, sortBy, sortDir, kindFilter, debouncedQ],
  )

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  })

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  })

  const transactionsQuery = useQuery({
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
    () => (categoriesQuery.data ?? []).filter((c) => c.kind === watchedKind),
    [categoriesQuery.data, watchedKind],
  )

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
    data: transactionsQuery.data,
    isPending: transactionsQuery.isPending,
    isError: transactionsQuery.isError,
    error: transactionsQuery.error,
    refetch: transactionsQuery.refetch,
    categoriesIsError: categoriesQuery.isError,
    categoriesError: categoriesQuery.error,
    refetchCategories: categoriesQuery.refetch,
    tagsIsError: tagsQuery.isError,
    tagsError: tagsQuery.error,
    refetchTags: tagsQuery.refetch,
    form,
    filteredCats,
    tags: tagsQuery.data,
  }
}
