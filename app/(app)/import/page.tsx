"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Row = Record<string, string>;

const INTERNAL = ["occurredAt", "kind", "description", "amountOriginal", "currencyCode", "categoryName"] as const;
type InternalKey = (typeof INTERNAL)[number];

export default function ImportPage() {
  const qc = useQueryClient();
  const [csvRows, setCsvRows] = React.useState<Row[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [mapping, setMapping] = React.useState<Partial<Record<InternalKey, string>>>({});
  const [pdfText, setPdfText] = React.useState("");
  const [pdfPages, setPdfPages] = React.useState(0);

  const importMut = useMutation({
    mutationFn: async (rows: object[]) => {
      const res = await fetch("/api/import/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      if (!res.ok) throw new Error("Import failed");
      return res.json() as Promise<{ created: number; errors: string[] }>;
    },
    onSuccess: (r) => {
      toast.success(`Imported ${r.created} rows`);
      if (r.errors.length) toast.message(r.errors.slice(0, 3).join("\n"));
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: () => toast.error("Import failed"),
  });

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    Papa.parse<Row>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = res.data.filter((r) => Object.keys(r).some((k) => r[k]?.trim()));
        setCsvRows(data);
        setHeaders(res.meta.fields?.filter(Boolean) as string[]);
        const guess: Partial<Record<InternalKey, string>> = {};
        for (const h of res.meta.fields ?? []) {
          const hl = h.toLowerCase();
          if (hl.includes("date")) guess.occurredAt = h;
          if (hl.includes("amount") || hl === "debit" || hl === "credit")
            guess.amountOriginal = h;
          if (hl.includes("desc") || hl.includes("memo")) guess.description = h;
          if (hl.includes("type") || hl.includes("kind")) guess.kind = h;
          if (hl.includes("currency") || hl === "ccy") guess.currencyCode = h;
          if (hl.includes("categor")) guess.categoryName = h;
        }
        setMapping(guess);
      },
    });
  }

  function buildMappedRows(): object[] {
    const m = mapping;
    if (!m.occurredAt || !m.amountOriginal) {
      toast.error("Map at least date and amount");
      return [];
    }
    return csvRows.map((r) => {
      const rawKind = (m.kind ? r[m.kind] ?? "" : "").toUpperCase();
      const kind =
        rawKind.startsWith("INC") || rawKind === "IN"
          ? "INCOME"
          : "EXPENSE";
      const amt = Math.abs(Number(String(r[m.amountOriginal!] ?? "").replace(/,/g, "")));
      return {
        occurredAt: new Date(r[m.occurredAt!] ?? "").toISOString(),
        kind,
        description: m.description ? r[m.description] ?? "" : "",
        amountOriginal: Number.isFinite(amt) ? amt : 0,
        currencyCode: (m.currencyCode ? r[m.currencyCode] : "USD") || "USD",
        categoryName: m.categoryName ? r[m.categoryName] : undefined,
      };
    }).filter((row) => row.amountOriginal > 0 && !Number.isNaN(Date.parse(row.occurredAt as string)));
  }

  async function onPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.set("file", f);
    const res = await fetch("/api/import/pdf", { method: "POST", body: fd });
    if (!res.ok) {
      toast.error("PDF parse failed");
      return;
    }
    const j = await res.json();
    setPdfText(j.text ?? "");
    setPdfPages(j.pages ?? 0);
    toast.success(`Extracted ${j.pages ?? 0} page(s)`);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Import</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted-fg)]">
          Map CSV columns to the ledger schema, or extract text from PDF statements for
          manual cleanup.
        </p>
      </header>

      <Tabs defaultValue="csv">
        <TabsList>
          <TabsTrigger value="csv">CSV</TabsTrigger>
          <TabsTrigger value="pdf">PDF</TabsTrigger>
        </TabsList>
        <TabsContent value="csv">
          <Card>
            <CardHeader>
              <CardTitle>CSV upload</CardTitle>
              <CardDescription>
                First row must be headers. We apply your global exchange rate at import
                time.
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
                    <div key={key} className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-fg)]">
                        {key}
                      </Label>
                      <select
                        className="flex h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 text-xs"
                        value={mapping[key] ?? ""}
                        onChange={(e) =>
                          setMapping((m) => ({ ...m, [key]: e.target.value || undefined }))
                        }
                      >
                        <option value="">—</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
              {csvRows.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-fg)]">
                  <span>{csvRows.length} rows detected</span>
                  <Button
                    type="button"
                    onClick={() => {
                      const rows = buildMappedRows();
                      if (rows.length) importMut.mutate(rows);
                    }}
                    disabled={importMut.isPending}
                  >
                    Import mapped rows
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pdf">
          <Card>
            <CardHeader>
              <CardTitle>PDF text extraction</CardTitle>
              <CardDescription>
                Bank PDFs vary widely; we surface raw text so you can verify and copy into
                CSV or manual entries.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pdf">PDF file</Label>
                <Input id="pdf" type="file" accept="application/pdf" onChange={onPdf} />
              </div>
              {pdfPages > 0 && (
                <p className="text-xs text-[var(--muted-fg)]">{pdfPages} pages</p>
              )}
              <Textarea
                readOnly
                className="font-mono text-xs"
                value={pdfText}
                placeholder="Extracted text appears here…"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
