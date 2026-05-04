"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";
import type { UseMutationResult } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
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

type Category = {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
  color: string | null;
  position: number;
};

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error("categories");
  return res.json();
}

export function CategoriesManager({ embedded }: { embedded?: boolean }) {
  const qc = useQueryClient();
  const { data: categories, isPending } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const [newName, setNewName] = React.useState("");
  const [newKind, setNewKind] = React.useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [newColor, setNewColor] = React.useState("#6366f1");

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          kind: newKind,
          color: newColor || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Could not create category");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Category created");
      setNewName("");
      setNewColor("#6366f1");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patchMut = useMutation({
    mutationFn: async (p: { id: string; body: Partial<{ name: string; kind: "INCOME" | "EXPENSE"; color: string | null }> }) => {
      const res = await fetch(`/api/categories/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p.body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Update failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Delete failed");
      }
    },
    onSuccess: () => {
      toast.success("Category removed");
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["known-stores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const income = (categories ?? []).filter((c) => c.kind === "INCOME");
  const expense = (categories ?? []).filter((c) => c.kind === "EXPENSE");

  return (
    <div className="space-y-8">
      {!embedded ? (
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--muted-fg)]">
              Create and manage income and expense categories. They power the ledger, CSV
              import, and{" "}
              <Link href="/settings?tab=stores" className="underline-offset-2 hover:underline">
                store mappings
              </Link>
              .
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/transactions">← Ledger</Link>
          </Button>
        </header>
      ) : (
        <p className="text-sm text-[var(--muted-fg)]">
          Categories are used by the ledger, imports, and store mappings. Names are unique per
          type (income vs expense).
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add category</CardTitle>
          <CardDescription>
            Names must be unique per type (income vs expense).{" "}
            <strong>Uncategorized</strong> is created automatically for unmatched imports.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2 sm:min-w-[200px]">
            <Label htmlFor="new-name">Name</Label>
            <Input
              id="new-name"
              placeholder="House expenses"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-kind">Type</Label>
            <select
              id="new-kind"
              className="flex h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm sm:w-40"
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as "INCOME" | "EXPENSE")}
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-color">Color</Label>
            <Input
              id="new-color"
              type="color"
              className="h-9 w-20 cursor-pointer p-1"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
            />
          </div>
          <Button
            type="button"
            disabled={!newName.trim() || createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            Create
          </Button>
        </CardContent>
      </Card>

      {isPending ? (
        <p className="text-sm text-[var(--muted-fg)]">Loading…</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <CategoryTable title="Income" rows={income} patchMut={patchMut} deleteMut={deleteMut} />
          <CategoryTable title="Expenses" rows={expense} patchMut={patchMut} deleteMut={deleteMut} />
        </div>
      )}
    </div>
  );
}

type PatchBody = Partial<{ name: string; kind: "INCOME" | "EXPENSE"; color: string | null }>;
type PatchMut = UseMutationResult<unknown, Error, { id: string; body: PatchBody }, unknown>;
type DeleteMut = UseMutationResult<void, Error, string, unknown>;

function CategoryTable({
  title,
  rows,
  patchMut,
  deleteMut,
}: {
  title: string;
  rows: Category[];
  patchMut: PatchMut;
  deleteMut: DeleteMut;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{rows.length} categor{rows.length === 1 ? "y" : "ies"}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-xs text-[var(--muted-fg)]">None yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <CategoryRow key={c.id} c={c} patchMut={patchMut} deleteMut={deleteMut} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryRow({
  c,
  patchMut,
  deleteMut,
}: {
  c: Category;
  patchMut: PatchMut;
  deleteMut: DeleteMut;
}) {
  const [name, setName] = React.useState(c.name);
  const [kind, setKind] = React.useState(c.kind);
  const [color, setColor] = React.useState(c.color ?? "#6366f1");

  React.useEffect(() => {
    setName(c.name);
    setKind(c.kind);
    setColor(c.color ?? "#6366f1");
  }, [c.id, c.name, c.kind, c.color]);

  const locked =
    c.name === "Uncategorized" && c.kind === "EXPENSE";

  function saveName() {
    const t = name.trim();
    if (!t || t === c.name) return;
    patchMut.mutate({ id: c.id, body: { name: t } });
  }

  function saveColor() {
    if (color === (c.color ?? "#6366f1")) return;
    patchMut.mutate({ id: c.id, body: { color } });
  }

  return (
    <TableRow>
      <TableCell className="py-2">
        <input
          type="color"
          className="h-8 w-full max-w-[36px] cursor-pointer rounded border-0 bg-transparent p-0"
          value={color}
          disabled={locked}
          onChange={(e) => setColor(e.target.value)}
          onBlur={saveColor}
        />
      </TableCell>
      <TableCell className="py-2">
        <Input
          className="h-8 text-xs"
          value={name}
          disabled={locked}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
        />
      </TableCell>
      <TableCell className="py-2">
        {locked ? (
          <Badge variant="default">Expense</Badge>
        ) : (
          <select
            className="h-8 w-full max-w-[120px] rounded-md border border-[var(--border)] bg-[var(--card)] px-2 text-xs"
            value={kind}
            onChange={(e) => {
              const v = e.target.value as "INCOME" | "EXPENSE";
              if (v === c.kind) return;
              setKind(v);
              patchMut.mutate({ id: c.id, body: { kind: v } });
            }}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
        )}
      </TableCell>
      <TableCell className="py-2">
        {!locked && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-[var(--muted-fg)] hover:text-red-400"
            aria-label="Delete category"
            onClick={() => deleteMut.mutate(c.id)}
            disabled={deleteMut.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
