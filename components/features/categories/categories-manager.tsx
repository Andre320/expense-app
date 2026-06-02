"use client"

import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"
import { EmptyState } from "@/components/patterns/empty-state"
import { InsetPanel } from "@/components/patterns/inset-panel"
import { PageIntro } from "@/components/patterns/page-intro"
import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
import { SelectField } from "@/components/select-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CategoryTable,
  KIND_OPTIONS,
  type Category,
} from "@/components/features/categories/category-table"
import { fetchJson, parseApiError } from "@/lib/shared/api-error"

async function fetchCategories(): Promise<Category[]> {
  return fetchJson("/api/categories")
}

export function CategoriesManager({ embedded }: { embedded?: boolean }) {
  const qc = useQueryClient()
  const {
    data: categories,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  })

  const [newName, setNewName] = React.useState("")
  const [newKind, setNewKind] = React.useState<"INCOME" | "EXPENSE">("EXPENSE")
  const [newColor, setNewColor] = React.useState("#6366f1")

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          kind: newKind,
          color: newColor || undefined,
        }),
      })
      if (!res.ok) throw await parseApiError(res)
      return res.json()
    },
    onSuccess: () => {
      toast.success("Category created")
      setNewName("")
      setNewColor("#6366f1")
      qc.invalidateQueries({ queryKey: ["categories"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const patchMut = useMutation({
    mutationFn: async (p: {
      id: string
      body: Partial<{ name: string; kind: "INCOME" | "EXPENSE"; color: string | null }>
    }) => {
      const res = await fetch(`/api/categories/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p.body),
      })
      if (!res.ok) throw await parseApiError(res)
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
      if (!res.ok) throw await parseApiError(res)
    },
    onSuccess: () => {
      toast.success("Category removed")
      qc.invalidateQueries({ queryKey: ["categories"] })
      qc.invalidateQueries({ queryKey: ["known-stores"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const income = (categories ?? []).filter((c) => c.kind === "INCOME")
  const expense = (categories ?? []).filter((c) => c.kind === "EXPENSE")

  return (
    <div className="space-y-8">
      {!embedded ? (
        <PageIntro
          title="Categories"
          description={
            <>
              Create and manage income and expense categories. They power the ledger, CSV import,
              and{" "}
              <Link href="/settings?tab=stores" className="underline-offset-2 hover:underline">
                store mappings
              </Link>
              .
            </>
          }
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href="/transactions">← Ledger</Link>
            </Button>
          }
        />
      ) : (
        <InsetPanel>
          <p className="text-muted-foreground text-sm">
            Categories are used by the ledger, imports, and store mappings. Names are unique per
            type (income vs expense).
          </p>
        </InsetPanel>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add category</CardTitle>
          <CardDescription>
            Names must be unique per type (income vs expense). <strong>Uncategorized</strong> is
            created automatically for unmatched imports.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2 sm:min-w-[200px]">
            <Label htmlFor="new-name">Name</Label>
            <Input
              id="new-name"
              placeholder="House expenses"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <SelectField
            id="new-kind"
            label="Type"
            value={newKind}
            onValueChange={(v) => setNewKind(v as "INCOME" | "EXPENSE")}
            options={[...KIND_OPTIONS]}
            className="sm:w-40"
          />
          <div className="space-y-2">
            <Label htmlFor="new-color">Color</Label>
            <Input
              id="new-color"
              type="color"
              className="h-9 w-20 cursor-pointer p-1"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
            />
          </div>
          <Button
            type="button"
            disabled={!newName.trim() || createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            Create
          </Button>
        </CardContent>
      </Card>

      {isPending ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : isError ? (
        <QueryErrorPanel
          title="Could not load categories"
          message={error?.message ?? "Categories are unavailable."}
          onRetry={() => void refetch()}
        />
      ) : !categories?.length ? (
        <EmptyState message="No categories yet. Create one above." />
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <CategoryTable title="Income" rows={income} patchMut={patchMut} deleteMut={deleteMut} />
          <CategoryTable
            title="Expenses"
            rows={expense}
            patchMut={patchMut}
            deleteMut={deleteMut}
          />
        </div>
      )}
    </div>
  )
}
