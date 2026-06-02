"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import { parseApiError } from "@/lib/shared/api-error"
import type { UseMutationResult } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { BacPreviewTable, type BacPreviewRow } from "./import-pdf-tab.parts"

export type { BacPreviewRow }

type ImportPdfTabProps = {
  bank: "BAC"
  bacPreview: BacPreviewRow[]
  bacWarnings: string[]
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
  bacWarnings,
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
      toast.error((await parseApiError(res)).message)
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
          {bacWarnings.length > 0 && (
            <div className="space-y-1.5 rounded-md border border-amber-200/60 bg-amber-50/50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="text-sm font-medium">Parser warnings</p>
              <ul className="text-muted-foreground list-disc space-y-0.5 pl-4 text-sm">
                {bacWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <BacPreviewTable bacPreview={bacPreview} importMut={importMut} onSave={saveBacPreview} />

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
