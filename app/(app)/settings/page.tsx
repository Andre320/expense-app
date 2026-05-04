"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoriesManager } from "@/components/categories-manager";
import { StoreMappingsPanel } from "@/components/store-mappings-panel";

const workspaceSchema = z.object({
  baseCurrency: z.string().min(3).max(3),
  quoteCurrency: z.string().min(3).max(3),
  quotePerBase: z.number().positive(),
  currentBalanceBase: z.number(),
  monthlyIncomeBase: z.number(),
  monthlyDeductionsBase: z.number(),
});

const costaRicaSchema = z.object({
  crCrcPerUsd: z.number().positive(),
  crSolidaristaPct: z.number().min(0).max(100),
  crPensionComplementariaPct: z.number().min(0).max(100),
  crEsppPct: z.number().min(0).max(100),
});

type WorkspaceForm = z.infer<typeof workspaceSchema>;
type CostaRicaForm = z.infer<typeof costaRicaSchema>;

type SettingsDto = WorkspaceForm & CostaRicaForm;

async function fetchSettings(): Promise<SettingsDto> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("settings");
  return res.json();
}

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab =
    tabParam === "cr"
      ? "costa-rica"
      : tabParam === "categories"
        ? "categories"
        : tabParam === "stores"
          ? "stores"
          : "workspace";

  const qc = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const workspaceForm = useForm<WorkspaceForm>({
    resolver: zodResolver(workspaceSchema),
    values: data
      ? {
          baseCurrency: data.baseCurrency,
          quoteCurrency: data.quoteCurrency,
          quotePerBase: data.quotePerBase,
          currentBalanceBase: data.currentBalanceBase,
          monthlyIncomeBase: data.monthlyIncomeBase,
          monthlyDeductionsBase: data.monthlyDeductionsBase,
        }
      : undefined,
  });

  const costaRicaForm = useForm<CostaRicaForm>({
    resolver: zodResolver(costaRicaSchema),
    values: data
      ? {
          crCrcPerUsd: data.crCrcPerUsd,
          crSolidaristaPct: data.crSolidaristaPct,
          crPensionComplementariaPct: data.crPensionComplementariaPct,
          crEsppPct: data.crEsppPct,
        }
      : undefined,
  });

  const mut = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
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
          Workspace currencies and forecast inputs. Costa Rica fields power the{" "}
          <Link href="/planner" className="underline-offset-2 hover:underline">
            Planner
          </Link>
          .
        </p>
      </header>

      <Tabs key={defaultTab} defaultValue={defaultTab} className="w-full">
        <TabsList className="flex h-auto min-h-9 w-full flex-wrap justify-start gap-1 p-1">
          <TabsTrigger value="workspace" className="shrink-0">
            Workspace
          </TabsTrigger>
          <TabsTrigger value="costa-rica" className="shrink-0">
            Costa Rica
          </TabsTrigger>
          <TabsTrigger value="categories" className="shrink-0">
            Categories
          </TabsTrigger>
          <TabsTrigger value="stores" className="shrink-0">
            Store maps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Currencies & rate</CardTitle>
              <CardDescription>
                <code className="text-[11px]">quotePerBase</code> is how many quote units
                equal <strong>one</strong> base unit (e.g. 1 USD → 18.5 MXN). If quote is CRC, this
                is also used when converting CRC amounts into base (except USD base — see Costa Rica
                tab for CRC per USD).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid max-w-xl gap-4"
                onSubmit={workspaceForm.handleSubmit((v) => mut.mutate(v))}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="baseCurrency">Base (reporting)</Label>
                    <Input id="baseCurrency" {...workspaceForm.register("baseCurrency")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quoteCurrency">Quote</Label>
                    <Input id="quoteCurrency" {...workspaceForm.register("quoteCurrency")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quotePerBase">Quote per 1 base</Label>
                  <Input
                    id="quotePerBase"
                    type="number"
                    step="0.00000001"
                    {...workspaceForm.register("quotePerBase", { valueAsNumber: true })}
                  />
                </div>
                <Separator className="my-1 bg-[var(--border)]" />
                <div className="space-y-2">
                  <Label htmlFor="currentBalanceBase">Current balance (base)</Label>
                  <Input
                    id="currentBalanceBase"
                    type="number"
                    {...workspaceForm.register("currentBalanceBase", { valueAsNumber: true })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyIncomeBase">Monthly income</Label>
                    <Input
                      id="monthlyIncomeBase"
                      type="number"
                      {...workspaceForm.register("monthlyIncomeBase", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyDeductionsBase">Monthly deductions</Label>
                    <Input
                      id="monthlyDeductionsBase"
                      type="number"
                      {...workspaceForm.register("monthlyDeductionsBase", { valueAsNumber: true })}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={mut.isPending}>
                  Save workspace
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <CategoriesManager embedded />
        </TabsContent>

        <TabsContent value="stores" className="space-y-6">
          <StoreMappingsPanel embedded />
        </TabsContent>

        <TabsContent value="costa-rica" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Income planner (Costa Rica)</CardTitle>
              <CardDescription>
                <strong>CRC per 1 USD</strong> converts dollar gross salary into colones for CCSS and
                renta. When your base currency is USD, saving a net profile from the planner also uses
                this rate. Optional percentages apply to <strong>gross monthly CRC</strong> (same basis
                as typical payroll deductions).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid max-w-xl gap-4"
                onSubmit={costaRicaForm.handleSubmit((v) => mut.mutate(v))}
              >
                <div className="space-y-2">
                  <Label htmlFor="crCrcPerUsd">CRC per 1 USD</Label>
                  <Input
                    id="crCrcPerUsd"
                    type="number"
                    step="0.01"
                    min="1"
                    {...costaRicaForm.register("crCrcPerUsd", { valueAsNumber: true })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="crSolidaristaPct">Asociación solidarista (% of gross)</Label>
                    <Input
                      id="crSolidaristaPct"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...costaRicaForm.register("crSolidaristaPct", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crPensionComplementariaPct">
                      Plan pensión complementaria (% of gross)
                    </Label>
                    <Input
                      id="crPensionComplementariaPct"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...costaRicaForm.register("crPensionComplementariaPct", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crEsppPct">ESPP / other payroll % (of gross)</Label>
                  <Input
                    id="crEsppPct"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...costaRicaForm.register("crEsppPct", { valueAsNumber: true })}
                  />
                </div>
                <Button type="submit" disabled={mut.isPending}>
                  Save Costa Rica
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--muted-fg)]">Loading…</p>}>
      <SettingsPageContent />
    </Suspense>
  );
}
