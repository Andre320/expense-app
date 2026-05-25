"use client"

import { getCoreRowModel, useReactTable, type SortingState } from "@tanstack/react-table"
import * as React from "react"
import { SELECT_NONE } from "@/components/select-field"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SelectField } from "@/components/select-field"
import { Skeleton } from "@/components/ui/skeleton"
import type { UseMutationResult } from "@tanstack/react-query"
import type { Tx } from "./use-transactions"
import { useTransactionColumns } from "./transaction-table-columns"
import { TransactionPagination, TransactionTableBody } from "./transaction-table-layout"

type TransactionTableProps = {
  data: { items: Tx[]; total: number; page: number; pageSize: number } | undefined
  isPending: boolean
  sorting: SortingState
  onSortingChange: React.Dispatch<React.SetStateAction<SortingState>>
  kindFilter: string
  onKindFilterChange: (value: string) => void
  q: string
  onQChange: (value: string) => void
  page: number
  onPageChange: React.Dispatch<React.SetStateAction<number>>
  deleteMut: UseMutationResult<void, Error, string, unknown>
}

export function TransactionTable({
  data,
  isPending,
  sorting,
  onSortingChange,
  kindFilter,
  onKindFilterChange,
  q,
  onQChange,
  page,
  onPageChange,
  deleteMut,
}: TransactionTableProps) {
  const columns = useTransactionColumns(deleteMut)

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table API
  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    manualPagination: true,
    pageCount: data ? Math.ceil(data.total / data.pageSize) : 0,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle>Entries</CardTitle>
          <CardDescription>{data ? `${data.total} total` : "—"} · TanStack Table</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search…"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            className="w-44"
          />
          <SelectField
            value={kindFilter}
            onValueChange={(v) => onKindFilterChange(v === SELECT_NONE ? "" : v)}
            triggerClassName="w-32"
            size="sm"
            options={[
              { value: "", label: "All kinds" },
              { value: "INCOME", label: "Income" },
              { value: "EXPENSE", label: "Expense" },
            ]}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <>
            <TransactionTableBody table={table} />
            <TransactionPagination data={data} page={page} onPageChange={onPageChange} />
          </>
        )}
      </CardContent>
    </Card>
  )
}
