"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { PageIntro } from "@/components/patterns/page-intro";
import { SELECT_NONE, SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Row = Record<string, string>;

const INTERNAL = ["occurredAt", "kind", "description", "amountOriginal", "currencyCode", "categoryName"] as const;
type InternalKey = (typeof INTERNAL)[number];

type BacPreviewRow = {
  reference: string;
  occurredAt: string;
  bankDescription: string;
  displayName: string;
  categoryId: string;
  categoryName: string;
  matchedPattern: string | null;
  currencyCode: "CRC" | "USD";
  amountOriginal: number;
  amountColones: number | null;
  amountDollars: number | null;
};

type ImportWorkspaceProps = { hideIntro?: boolean };

export function ImportWorkspace({ hideIntro }: ImportWorkspaceProps) {
  const qc = useQueryClient();
  const [bank, setBank] = React.useState<"BAC">("BAC");
  const [csvRows, setCsvRows] = React.useState<Row[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [mapping, setMapping] = React.useState<Partial<Record<InternalKey, string>>>({});
  const [pdfText, setPdfText] = React.useState("");
  const [pdfPages, setPdfPages] = React.useState(0);
  const [bacPreview, setBacPreview] = React.useState<BacPreviewRow[]>([]);

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
      setBacPreview([]);
    },
    onError: () => toast.error("Import failed"),
  });

  const bacParseMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/import/pdf/bac", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? "BAC parse failed");
      }
      return res.json() as Promise<{
        transactions: BacPreviewRow[];
        warnings: string[];
        pages: number;
      }>;
    },
    onSuccess: (data) => {
      setBacPreview(data.transactions);
      setPdfPages(data.pages);
      for (const w of data.warnings) toast.message(w);
      toast.success(
        data.transactions.length
          ? `Parsed ${data.transactions.length} purchase(s)`
          : "No purchases parsed",
      );
    },
    onError: (e: Error) => toast.error(e.message),
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
    return csvRows
      .map((r) => {
        const rawKind = (m.kind ? r[m.kind] ?? "" : "").toUpperCase();
        const kind =
          rawKind.startsWith("INC") || rawKind === "IN" ? "INCOME" : "EXPENSE";
        const amt = Math.abs(Number(String(r[m.amountOriginal!] ?? "").replace(/,/g, "")));
        return {
          occurredAt: new Date(r[m.occurredAt!] ?? "").toISOString(),
          kind,
          description: m.description ? r[m.description] ?? "" : "",
          amountOriginal: Number.isFinite(amt) ? amt : 0,
          currencyCode: (m.currencyCode ? r[m.currencyCode] : "USD") || "USD",
          categoryName: m.categoryName ? r[m.categoryName] : undefined,
        };
      })
      .filter(
        (row) =>
          row.amountOriginal > 0 &&
          !Number.isNaN(Date.parse(row.occurredAt as string)),
      );
  }

  async function onPdfGeneric(e: React.ChangeEvent<HTMLInputElement>) {
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

  function onPdfBac(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (bank !== "BAC") {
      toast.error("Select BAC as the bank");
      return;
    }
    bacParseMut.mutate(f);
  }

  function saveBacPreview() {
    if (!bacPreview.length) return;
    const rows = bacPreview.map((r) => ({
      occurredAt: r.occurredAt,
      kind: "EXPENSE" as const,
      description: `[${r.reference}] ${r.displayName}`,
      amountOriginal: r.amountOriginal,
      currencyCode: r.currencyCode,
      categoryId: r.categoryId,
    }));
    importMut.mutate(rows);
  }

  const headerOptions = React.useMemo(
    () => [
      { value: SELECT_NONE, label: "—" },
      ...headers.map((h) => ({ value: h, label: h })),
    ],
    [headers],
  );

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
                className="font-medium text-foreground underline-offset-4 hover:underline"
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
              setBank(v as "BAC");
              setBacPreview([]);
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
                      className="space-y-1 [&_label]:text-[10px] [&_label]:uppercase [&_label]:tracking-wider [&_label]:text-muted-foreground"
                    />
                  ))}
                </div>
              )}
              {csvRows.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>BAC statement (PDF)</CardTitle>
              <CardDescription>
                Parses <strong>B) Detalle de compras del periodo</strong>: fecha de pago,
                concepto, moneda (CRC/USD), and monto from the matching column. Applies{" "}
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
                  <Button
                    type="button"
                    onClick={saveBacPreview}
                    disabled={importMut.isPending}
                  >
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
                          <TableCell className="whitespace-nowrap text-xs">
                            {format(new Date(r.occurredAt), "yyyy-MM-dd")}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                          <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground">
                            {r.bankDescription}
                          </TableCell>
                          <TableCell className="max-w-[140px] truncate text-xs">
                            {r.displayName}
                            {r.matchedPattern ? (
                              <span className="ml-1 text-[10px] text-muted-foreground">
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
                          <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                            {r.amountColones != null
                              ? r.amountColones.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
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
                {pdfPages > 0 && (
                  <p className="text-xs text-muted-foreground">{pdfPages} page(s)</p>
                )}
                <Textarea
                  readOnly
                  className="font-mono text-xs"
                  value={pdfText}
                  placeholder="Extracted text appears here…"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
