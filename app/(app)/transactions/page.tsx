"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Category = { id: string; name: string; kind: "INCOME" | "EXPENSE" };
type Tx = {
  id: string;
  occurredAt: string;
  kind: "INCOME" | "EXPENSE";
  description: string;
  category: { id: string; name: string } | null;
  amountOriginal: number;
  currencyCode: string;
  amountBase: number;
  amountQuote: number;
  tags?: { id: string; name: string }[];
};

const formSchema = z.object({
  occurredAt: z.string().min(1),
  kind: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  amountOriginal: z.number().positive(),
  currencyCode: z.string().min(3).max(3),
  tagNames: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error("categories");
  return res.json();
}

async function fetchSettings() {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("settings");
  return res.json() as Promise<{
    baseCurrency: string;
    quoteCurrency: string;
  }>;
}

async function fetchTags(): Promise<{ id: string; name: string }[]> {
  const res = await fetch("/api/tags");
  if (!res.ok) throw new Error("tags");
  return res.json();
}

async function fetchTxs(params: URLSearchParams) {
  const res = await fetch(`/api/transactions?${params.toString()}`);
  if (!res.ok) throw new Error("tx");
  return res.json() as Promise<{ items: Tx[]; total: number; page: number; pageSize: number }>;
}

export default function TransactionsPage() {
  const qc = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "occurredAt", desc: true },
  ]);
  const [kindFilter, setKindFilter] = React.useState<string>("");
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const sort = sorting[0];
  const sortBy = sort?.id ?? "occurredAt";
  const sortDir = sort?.desc ? "desc" : "asc";

  const params = React.useMemo(() => {
    const p = new URLSearchParams({
      page: String(page),
      pageSize: "15",
      sortBy,
      sortDir,
    });
    if (kindFilter) p.set("kind", kindFilter);
    if (debouncedQ) p.set("q", debouncedQ);
    return p;
  }, [page, sortBy, sortDir, kindFilter, debouncedQ]);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });

  const { data, isPending } = useQuery({
    queryKey: ["transactions", params.toString()],
    queryFn: () => fetchTxs(params),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      occurredAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      kind: "EXPENSE",
      description: "",
      categoryId: "",
      amountOriginal: 1,
      currencyCode: settings?.baseCurrency ?? "USD",
      tagNames: "",
    },
  });

  React.useEffect(() => {
    if (settings?.baseCurrency) {
      form.setValue("currencyCode", settings.baseCurrency);
    }
  }, [settings?.baseCurrency, form]);

  const watchedKind = useWatch({ control: form.control, name: "kind" }) ?? "EXPENSE";
  const filteredCats = React.useMemo(
    () => (categories ?? []).filter((c) => c.kind === watchedKind),
    [categories, watchedKind],
  );

  const createMut = useMutation({
    mutationFn: async (body: FormValues) => {
      const names = [
        ...new Set(
          (body.tagNames ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ];
      const tagIds: string[] = [];
      for (const name of names) {
        const tr = await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (!tr.ok) throw new Error("Tag failed");
        const tj = (await tr.json()) as { id: string };
        tagIds.push(tj.id);
      }
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occurredAt: body.occurredAt,
          kind: body.kind,
          description: body.description,
          categoryId: body.categoryId || null,
          amountOriginal: body.amountOriginal,
          currencyCode: body.currencyCode,
          tagIds,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.formErrors?.join?.() ?? "Save failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Entry saved");
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["tags"] });
      form.reset({
        ...form.getValues(),
        description: "",
        amountOriginal: 1,
        tagNames: "",
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: () => toast.error("Could not delete"),
  });

  const columns = React.useMemo<ColumnDef<Tx>[]>(
    () => [
      {
        accessorKey: "occurredAt",
        header: "Date",
        cell: ({ getValue }) =>
          format(new Date(getValue<string>()), "MMM d, yyyy HH:mm"),
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
          row.original.tags?.length
            ? row.original.tags.map((t) => t.name).join(", ")
            : "—",
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
        header: () => `Base (${settings?.baseCurrency ?? "—"})`,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{(getValue() as number).toFixed(2)}</span>
        ),
      },
      {
        accessorKey: "amountQuote",
        header: () => `Quote (${settings?.quoteCurrency ?? "—"})`,
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
            className="text-[var(--muted-fg)] hover:text-red-400"
            onClick={() => deleteMut.mutate(row.original.id)}
            disabled={deleteMut.isPending}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [settings?.baseCurrency, settings?.quoteCurrency, deleteMut],
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    manualPagination: true,
    pageCount: data ? Math.ceil(data.total / data.pageSize) : 0,
    getCoreRowModel: getCoreRowModel(),
  });

  React.useEffect(() => {
    setPage(1);
  }, [kindFilter, debouncedQ, sortBy, sortDir]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Ledger</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted-fg)]">
          Manual entries with dual-currency snapshots. Sort columns and page through
          history.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>New entry</CardTitle>
          <CardDescription>
            Keyboard friendly: Tab through fields. Amounts are always positive; kind
            determines flow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={form.handleSubmit((v) => createMut.mutate(v))}
          >
            <div className="space-y-2">
              <Label htmlFor="occurredAt">Date & time</Label>
              <Input id="occurredAt" type="datetime-local" {...form.register("occurredAt")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kind">Kind</Label>
              <select
                id="kind"
                className="flex h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                {...form.register("kind")}
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                className="flex h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                {...form.register("categoryId")}
              >
                <option value="">—</option>
                {filteredCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...form.register("description")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tagNames">Tags (comma-separated)</Label>
              <Input
                id="tagNames"
                placeholder="e.g. travel, tax-deductible"
                list="known-tags"
                {...form.register("tagNames")}
              />
              <datalist id="known-tags">
                {(tags ?? []).map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amountOriginal">Amount</Label>
              <Input
                id="amountOriginal"
                type="number"
                step="0.01"
                min="0"
                {...form.register("amountOriginal", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currencyCode">Currency</Label>
              <select
                id="currencyCode"
                className="flex h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                {...form.register("currencyCode")}
              >
                <option value={settings?.baseCurrency ?? "USD"}>
                  {settings?.baseCurrency ?? "USD"} (base)
                </option>
                <option value={settings?.quoteCurrency ?? "EUR"}>
                  {settings?.quoteCurrency ?? "EUR"} (quote)
                </option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={createMut.isPending}>
                Save entry
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Entries</CardTitle>
            <CardDescription>
              {data ? `${data.total} total` : "—"} · TanStack Table
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-44"
            />
            <select
              className="h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 text-xs"
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
            >
              <option value="">All kinds</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <p className="text-sm text-[var(--muted-fg)]">Loading…</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={
                            header.column.getCanSort()
                              ? "cursor-pointer select-none hover:text-[var(--foreground)]"
                              : undefined
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
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
              <div className="mt-4 flex items-center justify-between text-xs text-[var(--muted-fg)]">
                <span>
                  Page {data?.page ?? 1} of{" "}
                  {data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      !data || page >= Math.ceil(data.total / data.pageSize)
                    }
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
