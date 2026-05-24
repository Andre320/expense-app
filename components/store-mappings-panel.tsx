"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { PageIntro } from "@/components/patterns/page-intro";
import { SELECT_NONE, SelectField } from "@/components/select-field";
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

  const categoryOptions = React.useMemo(
    () => [
      { value: SELECT_NONE, label: "—" },
      ...expenseCats.map((c) => ({ value: c.id, label: c.name })),
    ],
    [expenseCats],
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
        <PageIntro
          title="Store mappings"
          description={
            <>
              Match substrings in bank descriptions (e.g.{" "}
              <code className="text-[11px]">MXM</code>) to a clean name and expense category.
              Used automatically on BAC PDF import.
            </>
          }
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">← Settings</Link>
            </Button>
          }
        />
      ) : (
        <p className="text-sm text-muted-foreground">
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
          <SelectField
            id="cat"
            label="Category"
            value={categoryId}
            onValueChange={(v) => setCategoryId(v === SELECT_NONE ? "" : v)}
            options={categoryOptions}
            className="lg:min-w-[200px]"
          />
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
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !stores?.length ? (
            <p className="text-sm text-muted-foreground">No mappings yet.</p>
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
                        className="text-muted-foreground hover:text-destructive"
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
