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
import { FormSelect } from "@/components/form-select";
import { PageIntro } from "@/components/patterns/page-intro";
import { SELECT_NONE } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { QUOTE_CURRENCY, REPORTING_CURRENCY } from "@/lib/app-currency";

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
      currencyCode: REPORTING_CURRENCY,
      tagNames: "",
    },
  });

  React.useEffect(() => {
    form.setValue("currencyCode", REPORTING_CURRENCY);
  }, [form]);

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
        header: () => REPORTING_CURRENCY,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{(getValue() as number).toFixed(2)}</span>
        ),
      },
      {
        accessorKey: "amountQuote",
        header: () => QUOTE_CURRENCY,
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
            className="text-muted-foreground hover:text-destructive"
            onClick={() => deleteMut.mutate(row.original.id)}
            disabled={deleteMut.isPending}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [deleteMut],
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
      <PageIntro
        title="Ledger"
        description="Manual entries in CRC with USD equivalent. Sort columns and page through history."
      />

      <Card>
        <CardHeader>
          <CardTitle>New entry</CardTitle>
          <CardDescription>
            Keyboard friendly: Tab through fields. Amounts are always positive; kind
            determines flow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              onSubmit={form.handleSubmit((v) => createMut.mutate(v))}
            >
              <FormField
                control={form.control}
                name="occurredAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date & time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormSelect
                control={form.control}
                name="kind"
                label="Kind"
                options={[
                  { value: "EXPENSE", label: "Expense" },
                  { value: "INCOME", label: "Income" },
                ]}
              />
              <FormSelect
                control={form.control}
                name="categoryId"
                label="Category"
                placeholder="—"
                options={[
                  { value: "", label: "—" },
                  ...filteredCats.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tagNames"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Tags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. travel, tax-deductible"
                        list="known-tags"
                        {...field}
                      />
                    </FormControl>
                    <datalist id="known-tags">
                      {(tags ?? []).map((t) => (
                        <option key={t.id} value={t.name} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amountOriginal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormSelect
                control={form.control}
                name="currencyCode"
                label="Currency"
                options={[
                  { value: REPORTING_CURRENCY, label: REPORTING_CURRENCY },
                  { value: QUOTE_CURRENCY, label: QUOTE_CURRENCY },
                ]}
              />
              <div className="flex items-end">
                <Button type="submit" disabled={createMut.isPending}>
                  Save entry
                </Button>
              </div>
            </form>
          </Form>
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
            <SelectField
              value={kindFilter}
              onValueChange={(v) => setKindFilter(v === SELECT_NONE ? "" : v)}
              triggerClassName="w-32"
              size="sm"
              options={[
                { value: "", label: "All kinds" },
                { value: "INCOME", label: "Income" },
                { value: "EXPENSE", label: "Expense" },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
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
                              ? "cursor-pointer select-none hover:text-foreground"
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
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
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
