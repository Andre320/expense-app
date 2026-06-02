"use client"

import { Trash2 } from "lucide-react"
import { EmptyState } from "@/components/patterns/empty-state"
import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Store = {
  id: string
  pattern: string
  displayName: string
  categoryName: string
}

type Props = {
  stores: Store[] | undefined
  isPending: boolean
  isError: boolean
  errorMessage?: string
  onRetry: () => void
  onDelete: (id: string) => void
}

export function StoreMappingsTable({
  stores,
  isPending,
  isError,
  errorMessage,
  onRetry,
  onDelete,
}: Props) {
  if (isPending) {
    return <p className="text-muted-foreground text-sm">Loading…</p>
  }
  if (isError) {
    return (
      <QueryErrorPanel
        title="Could not load store mappings"
        message={errorMessage ?? "Mappings are unavailable."}
        onRetry={onRetry}
      />
    )
  }
  if (!stores?.length) {
    return <EmptyState message="No mappings yet." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pattern</TableHead>
          <TableHead>Clean name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {stores.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-mono text-xs">{s.pattern}</TableCell>
            <TableCell className="text-xs">{s.displayName}</TableCell>
            <TableCell className="text-xs">{s.categoryName}</TableCell>
            <TableCell>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                aria-label="Delete mapping"
                onClick={() => onDelete(s.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
