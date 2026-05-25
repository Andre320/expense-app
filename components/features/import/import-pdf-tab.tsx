"use client"

import Link from "next/link"
import * as React from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import type { UseMutationResult } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

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

type ImportPdfTabProps = {
  bank: "BAC"
  bacPreview: BacPreviewRow[]
  pdfPages: number
  bacParseMut: UseMutationResult<
    { transactions: BacPreviewRow[]; warnings: string[]; pages: number },
    Error,
    File,
    unknown
  >
  importMut: UseMutationResult<{ created: number; errors: string[] }, Error, object[], unknown>
}

export function ImportPdfTab({
  bank,
  bacPreview,
  pdfPages,
  bacParseMut,
  importMut,
}: ImportPdfTabProps) {
  const [pdfText, setPdfText] = React.useState("")

  async function onPdfGeneric(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const fd = new FormData()
    fd.set("file", f)
    const res = await fetch("/api/import/pdf", { method: "POST", body: fd })
    if (!res.ok) {
      toast.error("PDF parse failed")
      return
    }
    const j = await res.json()
    setPdfText(j.text ?? "")
    toast.success(`Extracted ${j.pages ?? 0} page(s)`)
  }

  function onPdfBac(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (bank !== "BAC") {
      toast.error("Select BAC as the bank")
      return
    }
    bacParseMut.mutate(f)
  }

  function saveBacPreview() {
    if (!bacPreview.length) return
    const rows = bacPreview.map((r) => ({
      occurredAt: r.occurredAt,
      kind: "EXPENSE" as const,
      description: `[${r.reference}] ${r.displayName}`,
      amountOriginal: r.amountOriginal,
      currencyCode: r.currencyCode,
      categoryId: r.categoryId,
    }))
    importMut.mutate(rows)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>BAC statement (PDF)</CardTitle>
          <CardDescription>
            Parses <strong>B) Detalle de compras del periodo</strong>: fecha de pago, concepto,
            moneda (CRC/USD), and monto from the matching column. Applies{" "}
            <Link href="/settings?tab=stores" className="underline-offset-2 hover:underline">
              store mappings
            </Link>{" "}
            to concepto before preview/save. Uses the PDF text layer via{" "}
            <code className="text-[11px]">pdf-parse</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pdf-bac">Estado de cuenta (PDF)</Label>
            <Input
              id="pdf-bac"
              type="file"
              accept="application/pdf"
              disabled={bank !== "BAC"}
              onChange={onPdfBac}
            />
          </div>
          {bacParseMut.isPending && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {bacPreview.length > 0 && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                {bacPreview.length} row(s) · Review before saving as expenses
              </CardDescription>
            </div>
            <Button type="button" onClick={saveBacPreview} disabled={importMut.isPending}>
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
                    <TableCell className="max-w-[120px] truncate text-xs">
                      {r.categoryName}
                    </TableCell>
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
      )}

      <Card>
        <CardHeader>
          <CardTitle>Generic PDF (raw text)</CardTitle>
          <CardDescription>
            For non-BAC PDFs: extract plain text only (no table parsing).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pdf">PDF file</Label>
            <Input id="pdf" type="file" accept="application/pdf" onChange={onPdfGeneric} />
          </div>
          {pdfPages > 0 && <p className="text-muted-foreground text-xs">{pdfPages} page(s)</p>}
          <Textarea
            readOnly
            className="font-mono text-xs"
            value={pdfText}
            placeholder="Extracted text appears here…"
          />
        </CardContent>
      </Card>
    </div>
  )
}
