"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Goal = {
  id: string;
  name: string;
  targetBase: number | null;
  balanceBase: number;
  color: string | null;
};

async function fetchGoals(): Promise<Goal[]> {
  const res = await fetch("/api/savings");
  if (!res.ok) throw new Error("goals");
  return res.json();
}

export default function SavingsPage() {
  const qc = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["savings"],
    queryFn: fetchGoals,
  });

  const [name, setName] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [balance, setBalance] = React.useState("");

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          targetBase: target ? Number(target) : null,
          balanceBase: balance ? Number(balance) : 0,
        }),
      });
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Goal created");
      setName("");
      setTarget("");
      setBalance("");
      qc.invalidateQueries({ queryKey: ["savings"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: () => toast.error("Could not create goal"),
  });

  const patchMut = useMutation({
    mutationFn: async (g: Goal) => {
      const res = await fetch(`/api/savings/${g.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balanceBase: g.balanceBase }),
      });
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["savings"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: () => toast.error("Update failed"),
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Savings</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted-fg)]">
          Track dedicated goals and account balances in your base currency.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>New goal</CardTitle>
          <CardDescription>Optional target; balance is what you have today.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="g-name">Name</Label>
            <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-target">Target</Label>
            <Input
              id="g-target"
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="optional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-bal">Balance</Label>
            <Input
              id="g-bal"
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
          </div>
          <Button
            type="button"
            disabled={!name.trim() || createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            Add goal
          </Button>
        </CardContent>
      </Card>

      {isPending ? (
        <p className="text-sm text-[var(--muted-fg)]">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data ?? []).map((g) => (
            <Card key={g.id} className="overflow-hidden">
              <div
                className="h-1 w-full"
                style={{ background: g.color ?? "var(--chart-savings)" }}
              />
              <CardHeader>
                <CardTitle className="text-base">{g.name}</CardTitle>
                <CardDescription>
                  {g.targetBase != null
                    ? `Target ${g.targetBase.toLocaleString()} · `
                    : ""}
                  Progress{" "}
                  {g.targetBase
                    ? `${Math.min(100, Math.round((g.balanceBase / g.targetBase) * 100))}%`
                    : "—"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase">Balance</Label>
                  <Input
                    type="number"
                    className="w-36"
                    defaultValue={g.balanceBase}
                    key={g.id + g.balanceBase}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v) && v !== g.balanceBase) {
                        patchMut.mutate({ ...g, balanceBase: v });
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
