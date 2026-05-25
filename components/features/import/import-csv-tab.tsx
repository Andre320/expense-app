"use client"

import Papa from "papaparse"
import * as React from "react"
import { toast } from "sonner"
import type { UseMutationResult } from "@tanstack/react-query"
import { SELECT_NONE, SelectField } from "@/components/select-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Row = Record<string, string>

const INTERNAL = [
  "occurredAt",
  "kind",
  "description",
  "amountOriginal",
  "currencyCode",
  "categoryName",
] as const
type InternalKey = (typeof INTERNAL)[number]

type ImportCsvTabProps = {
  importMut: UseMutationResult<{ created: number; errors: string[] }, Error, object[], unknown>
}

export function ImportCsvTab({ importMut }: ImportCsvTabProps) {
  const [csvRows, setCsvRows] = React.useState<Row[]>([])
  const [headers, setHeaders] = React.useState<string[]>([])
  const [mapping, setMapping] = React.useState<Partial<Record<InternalKey, string>>>({})

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    Papa.parse<Row>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = res.data.filter((r) => Object.keys(r).some((k) => r[k]?.trim()))
        setCsvRows(data)
        setHeaders(res.meta.fields?.filter(Boolean) as string[])
        const guess: Partial<Record<InternalKey, string>> = {}
        for (const h of res.meta.fields ?? []) {
          const hl = h.toLowerCase()
          if (hl.includes("date")) guess.occurredAt = h
          if (hl.includes("amount") || hl === "debit" || hl === "credit") guess.amountOriginal = h
          if (hl.includes("desc") || hl.includes("memo")) guess.description = h
          if (hl.includes("type") || hl.includes("kind")) guess.kind = h
          if (hl.includes("currency") || hl === "ccy") guess.currencyCode = h
          if (hl.includes("categor")) guess.categoryName = h
        }
        setMapping(guess)
      },
    })
  }

  function buildMappedRows(): object[] {
    const m = mapping
    if (!m.occurredAt || !m.amountOriginal) {
      toast.error("Map at least date and amount")
      return []
    }
    return csvRows
      .map((r) => {
        const rawKind = (m.kind ? (r[m.kind] ?? "") : "").toUpperCase()
        const kind = rawKind.startsWith("INC") || rawKind === "IN" ? "INCOME" : "EXPENSE"
        const amt = Math.abs(Number(String(r[m.amountOriginal!] ?? "").replace(/,/g, "")))
        return {
          occurredAt: new Date(r[m.occurredAt!] ?? "").toISOString(),
          kind,
          description: m.description ? (r[m.description] ?? "") : "",
          amountOriginal: Number.isFinite(amt) ? amt : 0,
          currencyCode: (m.currencyCode ? r[m.currencyCode] : "USD") || "USD",
          categoryName: m.categoryName ? r[m.categoryName] : undefined,
        }
      })
      .filter(
        (row) => row.amountOriginal > 0 && !Number.isNaN(Date.parse(row.occurredAt as string)),
      )
  }

  const headerOptions = React.useMemo(
    () => [{ value: SELECT_NONE, label: "—" }, ...headers.map((h) => ({ value: h, label: h }))],
    [headers],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV upload</CardTitle>
        <CardDescription>
          First row must be headers. We apply your global exchange rate at import time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="csv">File</Label>
          <Input id="csv" type="file" accept=".csv,text/csv" onChange={onFile} />
        </div>
        {headers.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INTERNAL.map((key) => (
              <SelectField
                key={key}
                label={key}
                value={mapping[key] ?? ""}
                onValueChange={(v) =>
                  setMapping((m) => ({
                    ...m,
                    [key]: v === SELECT_NONE ? undefined : v,
                  }))
                }
                options={headerOptions}
                triggerClassName="text-xs"
                className="[&_label]:text-muted-foreground space-y-1 [&_label]:text-[10px] [&_label]:tracking-wider [&_label]:uppercase"
              />
            ))}
          </div>
        )}
        {csvRows.length > 0 && (
          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
            <span>{csvRows.length} rows detected</span>
            <Button
              type="button"
              onClick={() => {
                const rows = buildMappedRows()
                if (rows.length) importMut.mutate(rows)
              }}
              disabled={importMut.isPending}
            >
              Import mapped rows
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
