"use client"

import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"
import { parseApiError } from "@/lib/shared/api-error"
import { PageIntro } from "@/components/patterns/page-intro"
import { SelectField } from "@/components/select-field"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImportCsvTab } from "@/components/features/import/import-csv-tab"
import { ImportPdfTab, type BacPreviewRow } from "@/components/features/import/import-pdf-tab"

type ImportWorkspaceProps = { hideIntro?: boolean }

export function ImportWorkspace({ hideIntro }: ImportWorkspaceProps) {
  const qc = useQueryClient()
  const [bank, setBank] = React.useState<"BAC">("BAC")
  const [pdfPages, setPdfPages] = React.useState(0)
  const [bacPreview, setBacPreview] = React.useState<BacPreviewRow[]>([])

  const importMut = useMutation({
    mutationFn: async (rows: object[]) => {
      const res = await fetch("/api/import/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      })
      if (!res.ok) throw await parseApiError(res)
      return res.json() as Promise<{ created: number; errors: string[] }>
    },
    onSuccess: (r) => {
      toast.success(`Imported ${r.created} rows`)
      if (r.errors.length) toast.message(r.errors.slice(0, 3).join("\n"))
      qc.invalidateQueries({ queryKey: ["transactions"] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
      setBacPreview([])
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const bacParseMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.set("file", file)
      const res = await fetch("/api/import/pdf/bac", { method: "POST", body: fd })
      if (!res.ok) throw await parseApiError(res)
      return res.json() as Promise<{
        transactions: BacPreviewRow[]
        warnings: string[]
        pages: number
      }>
    },
    onSuccess: (data) => {
      setBacPreview(data.transactions)
      setPdfPages(data.pages)
      for (const w of data.warnings) toast.message(w)
      toast.success(
        data.transactions.length
          ? `Parsed ${data.transactions.length} purchase(s)`
          : "No purchases parsed",
      )
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-8">
      {!hideIntro ? (
        <PageIntro
          stacked
          title="Import"
          description={
            <>
              Map CSV columns to the ledger schema, or import BAC statement PDFs with a guided
              preview.{" "}
              <Link
                href="/settings?tab=stores"
                className="text-foreground font-medium underline-offset-4 hover:underline"
              >
                Store mappings
              </Link>{" "}
              clean up merchant names and categories automatically.
            </>
          }
        />
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bank</CardTitle>
          <CardDescription>
            Statement parser is bank-specific. More banks can be added later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SelectField
            id="bank"
            label="Statement bank"
            value={bank}
            onValueChange={(v) => {
              setBank(v as "BAC")
              setBacPreview([])
            }}
            options={[{ value: "BAC", label: "BAC (Costa Rica)" }]}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="csv">
        <TabsList>
          <TabsTrigger value="csv">CSV</TabsTrigger>
          <TabsTrigger value="pdf">PDF</TabsTrigger>
        </TabsList>
        <TabsContent value="csv">
          <ImportCsvTab importMut={importMut} />
        </TabsContent>
        <TabsContent value="pdf">
          <ImportPdfTab
            bank={bank}
            bacPreview={bacPreview}
            pdfPages={pdfPages}
            bacParseMut={bacParseMut}
            importMut={importMut}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
