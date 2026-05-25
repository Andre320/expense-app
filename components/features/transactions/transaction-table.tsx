"use client"

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type Table as TanStackTable,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { Trash2 } from "lucide-react"
import * as React from "react"
import { SELECT_NONE } from "@/components/select-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SelectField } from "@/components/select-field"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { QUOTE_CURRENCY, REPORTING_CURRENCY } from "@/lib/shared/app-currency"
import type { UseMutationResult } from "@tanstack/react-query"
import type { Tx } from "./use-transactions"

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

export function useTransactionColumns(deleteMut: UseMutationResult<void, Error, string, unknown>) {
  return React.useMemo<ColumnDef<Tx>[]>(
    () => [
      {
        accessorKey: "occurredAt",
        header: "Date",
        cell: ({ getValue }) => format(new Date(getValue<string>()), "MMM d, yyyy HH:mm"),
      },
      {
        accessorKey: "kind",
        header: "Kind",
        cell: ({ getValue }) => (
          <Badge variant={getValue<string>() === "INCOME" ? "success" : "default"}>
            {getValue<string>()}
          </Badge>
        ),
      },
      { accessorKey: "description", header: "Description" },
      {
        id: "tags",
        header: "Tags",
        cell: ({ row }) =>
          row.original.tags?.length ? row.original.tags.map((t) => t.name).join(", ") : "—",
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => row.original.category?.name ?? "—",
      },
      {
        id: "orig",
        header: "Original",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.amountOriginal.toFixed(2)} {row.original.currencyCode}
          </span>
        ),
      },
      {
        accessorKey: "amountBase",
        header: () => REPORTING_CURRENCY,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{(getValue() as number).toFixed(2)}</span>
        ),
      },
      {
        accessorKey: "amountQuote",
        header: () => QUOTE_CURRENCY,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{(getValue() as number).toFixed(2)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => deleteMut.mutate(row.original.id)}
            disabled={deleteMut.isPending}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [deleteMut],
  )
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

function TransactionTableBody({ table }: { table: TanStackTable<Tx> }) {
  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id}>
            {hg.headers.map((header) => (
              <TableHead
                key={header.id}
                className={
                  header.column.getCanSort()
                    ? "hover:text-foreground cursor-pointer select-none"
                    : undefined
                }
                onClick={header.column.getToggleSortingHandler()}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {{
                  asc: " ↑",
                  desc: " ↓",
                }[header.column.getIsSorted() as string] ?? null}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function TransactionPagination({
  data,
  page,
  onPageChange,
}: {
  data: { total: number; page: number; pageSize: number } | undefined
  page: number
  onPageChange: React.Dispatch<React.SetStateAction<number>>
}) {
  return (
    <div className="text-muted-foreground mt-4 flex items-center justify-between text-xs">
      <span>
        Page {data?.page ?? 1} of {data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!data || page >= Math.ceil(data.total / data.pageSize)}
          onClick={() => onPageChange((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
