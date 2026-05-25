"use client"

import { flexRender, type Table as TanStackTable } from "@tanstack/react-table"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Tx } from "./use-transactions"

export function TransactionTableBody({ table }: { table: TanStackTable<Tx> }) {
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

export function TransactionPagination({
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
