"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"
import { buildCategoryOptions } from "@/components/features/import/store-category-options"
import { fetchJson, parseApiError } from "@/lib/shared/api-error"

type Category = { id: string; name: string; kind: string }
type KnownStore = {
  id: string
  pattern: string
  displayName: string
  categoryId: string
  categoryName: string
  position: number
}

async function fetchCategories(): Promise<Category[]> {
  return fetchJson("/api/categories")
}

async function fetchStores(): Promise<KnownStore[]> {
  return fetchJson("/api/known-stores")
}

export function useStoreMappings() {
  const qc = useQueryClient()
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  })
  const storesQuery = useQuery({
    queryKey: ["known-stores"],
    queryFn: fetchStores,
  })

  const categoryOptions = React.useMemo(
    () => buildCategoryOptions(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  )

  const [pattern, setPattern] = React.useState("")
  const [displayName, setDisplayName] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/known-stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern, displayName, categoryId }),
      })
      if (!res.ok) throw await parseApiError(res)
      return res.json()
    },
    onSuccess: () => {
      toast.success("Mapping saved")
      setPattern("")
      setDisplayName("")
      setCategoryId("")
      qc.invalidateQueries({ queryKey: ["known-stores"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/known-stores/${id}`, { method: "DELETE" })
      if (!res.ok) throw await parseApiError(res)
    },
    onSuccess: () => {
      toast.success("Removed")
      qc.invalidateQueries({ queryKey: ["known-stores"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return {
    stores: storesQuery.data,
    isPending: storesQuery.isPending,
    isError: storesQuery.isError,
    error: storesQuery.error,
    refetch: storesQuery.refetch,
    categoriesIsError: categoriesQuery.isError,
    categoriesError: categoriesQuery.error,
    refetchCategories: categoriesQuery.refetch,
    categoryOptions,
    pattern,
    setPattern,
    displayName,
    setDisplayName,
    categoryId,
    setCategoryId,
    createMut,
    deleteMut,
  }
}
