"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const schema = z.object({
  baseCurrency: z.string().min(3).max(3),
  quoteCurrency: z.string().min(3).max(3),
  quotePerBase: z.number().positive(),
  currentBalanceBase: z.number(),
  monthlyIncomeBase: z.number(),
  monthlyDeductionsBase: z.number(),
});

type Form = z.infer<typeof schema>;

async function fetchSettings(): Promise<Form> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("settings");
  return res.json();
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    values: data,
  });

  const mut = useMutation({
    mutationFn: async (body: Partial<Form>) => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: () => toast.error("Save failed"),
  });

  if (isPending || !data) {
    return <p className="text-sm text-[var(--muted-fg)]">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted-fg)]">
          Dual-currency defaults and forecast inputs. Transactions snapshot the rate in
          effect when you save them.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Currencies & rate</CardTitle>
          <CardDescription>
            <code className="text-[11px]">quotePerBase</code> is how many quote units
            equal <strong>one</strong> base unit (e.g. 1 USD → 18.5 MXN).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid max-w-xl gap-4"
            onSubmit={form.handleSubmit((v) => mut.mutate(v))}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="baseCurrency">Base (reporting)</Label>
                <Input id="baseCurrency" {...form.register("baseCurrency")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quoteCurrency">Quote</Label>
                <Input id="quoteCurrency" {...form.register("quoteCurrency")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quotePerBase">Quote per 1 base</Label>
              <Input
                id="quotePerBase"
                type="number"
                step="0.00000001"
                {...form.register("quotePerBase", { valueAsNumber: true })}
              />
            </div>
            <Separator className="my-1 bg-[var(--border)]" />
            <div className="space-y-2">
              <Label htmlFor="currentBalanceBase">Current balance (base)</Label>
              <Input
                id="currentBalanceBase"
                type="number"
                {...form.register("currentBalanceBase", { valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthlyIncomeBase">Monthly income</Label>
                <Input
                  id="monthlyIncomeBase"
                  type="number"
                  {...form.register("monthlyIncomeBase", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyDeductionsBase">Monthly deductions</Label>
                <Input
                  id="monthlyDeductionsBase"
                  type="number"
                  {...form.register("monthlyDeductionsBase", { valueAsNumber: true })}
                />
              </div>
            </div>
            <Button type="submit" disabled={mut.isPending}>
              Save settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
