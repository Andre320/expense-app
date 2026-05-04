"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";
import { GoalColorStripe } from "@/components/patterns/goal-color-stripe";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SavingsGoalDto = {
  id: string;
  name: string;
  targetAmount: number | null;
  currentAmount: number;
  priorityOrder: number;
  color: string | null;
};

async function fetchGoals(): Promise<SavingsGoalDto[]> {
  const res = await fetch("/api/savings");
  if (!res.ok) throw new Error("goals");
  return res.json();
}

export function SavingsGoalsManager({ embedded }: { embedded?: boolean }) {
  const qc = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["savings"],
    queryFn: fetchGoals,
  });

  const [name, setName] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [current, setCurrent] = React.useState("");
  const [priority, setPriority] = React.useState("");

  const createMut = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        name: name.trim(),
        targetAmount: target.trim() ? Number(target) : null,
        currentAmount: current.trim() ? Number(current) : 0,
      };
      if (priority.trim()) body.priorityOrder = Number.parseInt(priority, 10);
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Goal created");
      setName("");
      setTarget("");
      setCurrent("");
      setPriority("");
      qc.invalidateQueries({ queryKey: ["savings"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: () => toast.error("Could not create goal"),
  });

  const patchMut = useMutation({
    mutationFn: async (p: { id: string; patch: Partial<SavingsGoalDto> }) => {
      const res = await fetch(`/api/savings/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p.patch),
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

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/savings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("fail");
    },
    onSuccess: () => {
      toast.success("Goal removed");
      qc.invalidateQueries({ queryKey: ["savings"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: () => toast.error("Delete failed"),
  });

  const sorted = React.useMemo(
    () => [...(data ?? [])].sort((a, b) => a.priorityOrder - b.priorityOrder || a.name.localeCompare(b.name)),
    [data],
  );

  return (
    <div className="space-y-6">
      {!embedded ? (
        <header>
          <h2 className="text-lg font-semibold tracking-tight">Savings goals</h2>
          <p className="mt-1 text-sm text-[var(--muted-fg)]">
            Lower priority number = funded first in the forecast waterfall.
          </p>
        </header>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">New goal</CardTitle>
          <CardDescription>Target amount, current balance, and optional explicit priority.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="sg-name">Name</Label>
            <Input id="sg-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sg-target">Target amount</Label>
            <Input
              id="sg-target"
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="optional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sg-current">Current amount</Label>
            <Input
              id="sg-current"
              type="number"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sg-pri">Priority</Label>
            <Input
              id="sg-pri"
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              placeholder="auto"
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
          {sorted.map((g) => (
            <Card key={g.id} className="overflow-hidden">
              <GoalColorStripe color={g.color} />
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{g.name}</CardTitle>
                <CardDescription>
                  Priority {g.priorityOrder}
                  {g.targetAmount != null
                    ? ` · ${Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))}% to target`
                    : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase">Current</Label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      defaultValue={g.currentAmount}
                      key={`c-${g.id}-${g.currentAmount}`}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isFinite(v) && v !== g.currentAmount) {
                          patchMut.mutate({ id: g.id, patch: { currentAmount: v } });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase">Target</Label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      defaultValue={g.targetAmount ?? ""}
                      key={`t-${g.id}-${g.targetAmount}`}
                      placeholder="—"
                      onBlur={(e) => {
                        const raw = e.target.value.trim();
                        const next = raw === "" ? null : Number(raw);
                        if (next !== null && !Number.isFinite(next)) return;
                        const prev = g.targetAmount;
                        if (next !== prev) patchMut.mutate({ id: g.id, patch: { targetAmount: next } });
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase">Priority order</Label>
                    <Input
                      type="number"
                      className="h-8 w-20 text-xs"
                      defaultValue={g.priorityOrder}
                      key={`p-${g.id}-${g.priorityOrder}`}
                      onBlur={(e) => {
                        const v = Number.parseInt(e.target.value, 10);
                        if (Number.isFinite(v) && v !== g.priorityOrder) {
                          patchMut.mutate({ id: g.id, patch: { priorityOrder: v } });
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-auto text-[var(--muted-fg)] hover:text-red-400"
                    aria-label="Delete goal"
                    onClick={() => deleteMut.mutate(g.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
