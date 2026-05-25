"use client"

import { format } from "date-fns"
import { Trash2 } from "lucide-react"
import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { UseMutationResult } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { QUOTE_CURRENCY, REPORTING_CURRENCY } from "@/lib/shared/app-currency"
import type { Tx } from "./use-transactions"

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
