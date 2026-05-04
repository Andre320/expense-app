"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";
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

type Category = { id: string; name: string; kind: string };
type KnownStore = {
  id: string;
  pattern: string;
  displayName: string;
  categoryId: string;
  categoryName: string;
  position: number;
};

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error("categories");
  return res.json();
}

async function fetchStores(): Promise<KnownStore[]> {
  const res = await fetch("/api/known-stores");
  if (!res.ok) throw new Error("stores");
  return res.json();
}

export function StoreMappingsPanel({ embedded }: { embedded?: boolean }) {
  const qc = useQueryClient();
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { data: stores, isPending } = useQuery({
    queryKey: ["known-stores"],
    queryFn: fetchStores,
  });

  const expenseCats = React.useMemo(
    () => (categories ?? []).filter((c) => c.kind === "EXPENSE"),
    [categories],
  );

  const [pattern, setPattern] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/known-stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern, displayName, categoryId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Could not create mapping");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Mapping saved");
      setPattern("");
      setDisplayName("");
      setCategoryId("");
      qc.invalidateQueries({ queryKey: ["known-stores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/known-stores/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["known-stores"] });
    },
    onError: () => toast.error("Could not delete"),
  });

  return (
    <div className="space-y-8">
      {!embedded ? (
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Store mappings</h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--muted-fg)]">
              Match substrings in bank descriptions (e.g. <code className="text-[11px]">MXM</code>) to a
              clean name and expense category. Used automatically on BAC PDF import.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings">← Settings</Link>
          </Button>
        </header>
      ) : (
        <p className="text-sm text-[var(--muted-fg)]">
          Patterns match case-insensitive on import. Expense categories come from your category list.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add mapping</CardTitle>
          <CardDescription>
            Pattern is matched case-insensitive anywhere in the concepto. Longer patterns take
            priority over shorter ones.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="space-y-2 lg:min-w-[140px]">
            <Label htmlFor="pattern">Pattern</Label>
            <Input
              id="pattern"
              placeholder="MXM"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            />
          </div>
          <div className="space-y-2 lg:min-w-[200px]">
            <Label htmlFor="displayName">Clean name</Label>
            <Input
              id="displayName"
              placeholder="Walmart / MXM"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2 lg:min-w-[200px]">
            <Label htmlFor="cat">Category</Label>
            <select
              id="cat"
              className="flex h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">—</option>
              {expenseCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            disabled={!pattern.trim() || !displayName.trim() || !categoryId || createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            Add mapping
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current mappings</CardTitle>
          <CardDescription>{stores?.length ?? 0} rule(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <p className="text-sm text-[var(--muted-fg)]">Loading…</p>
          ) : !stores?.length ? (
            <p className="text-sm text-[var(--muted-fg)]">No mappings yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pattern</TableHead>
                  <TableHead>Clean name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.pattern}</TableCell>
                    <TableCell className="text-xs">{s.displayName}</TableCell>
                    <TableCell className="text-xs">{s.categoryName}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-[var(--muted-fg)] hover:text-red-400"
                        aria-label="Delete mapping"
                        onClick={() => deleteMut.mutate(s.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
