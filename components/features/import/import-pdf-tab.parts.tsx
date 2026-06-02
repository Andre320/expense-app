import { format } from "date-fns"
import type { UseMutationResult } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
export type BacPreviewRow = {
  reference: string
  occurredAt: string
  bankDescription: string
  displayName: string
  categoryId: string
  categoryName: string
  matchedPattern: string | null
  currencyCode: "CRC" | "USD"
  amountOriginal: number
  amountColones: number | null
  amountDollars: number | null
}

type BacPreviewTableProps = {
  bacPreview: BacPreviewRow[]
  importMut: UseMutationResult<{ created: number; errors: string[] }, Error, object[], unknown>
  onSave: () => void
}

export function BacPreviewTable({ bacPreview, importMut, onSave }: BacPreviewTableProps) {
  if (bacPreview.length === 0) return null

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            {bacPreview.length} row(s) · Review before saving as expenses
          </CardDescription>
        </div>
        <Button type="button" onClick={onSave} disabled={importMut.isPending}>
          Save to ledger
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Ref</TableHead>
              <TableHead>Bank text</TableHead>
              <TableHead>Clean name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>CCY</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Colones</TableHead>
              <TableHead className="text-right">Dólares</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bacPreview.map((r) => (
              <TableRow key={`${r.reference}-${r.occurredAt}-${r.amountOriginal}`}>
                <TableCell className="text-xs whitespace-nowrap">
                  {format(new Date(r.occurredAt), "yyyy-MM-dd")}
                </TableCell>
                <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                <TableCell className="text-muted-foreground max-w-[140px] truncate text-xs">
                  {r.bankDescription}
                </TableCell>
                <TableCell className="max-w-[140px] truncate text-xs">
                  {r.displayName}
                  {r.matchedPattern ? (
                    <span className="text-muted-foreground ml-1 text-[10px]">
                      ({r.matchedPattern})
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="max-w-[120px] truncate text-xs">{r.categoryName}</TableCell>
                <TableCell className="text-xs">{r.currencyCode}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {r.amountOriginal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-muted-foreground text-right text-xs tabular-nums">
                  {r.amountColones != null
                    ? r.amountColones.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-right text-xs tabular-nums">
                  {r.amountDollars != null
                    ? r.amountDollars.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
