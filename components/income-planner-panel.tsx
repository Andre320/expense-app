"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rechartsTooltipContentStyle } from "@/lib/chart-style";
import {
  computeCrSalary,
  CR_CCSS_EMPLOYEE_RATE_2026,
  grossMonthlyCrcFromInput,
  plannedNetCrcToMonthlyIncomeBase,
  type CrPayPeriod,
} from "@/lib/utils/taxCalculator";
import { liveNetCrcToExpectedIncomeBase } from "@/lib/forecast-planning";

type Settings = {
  baseCurrency: string;
  quoteCurrency: string;
  quotePerBase: number;
  monthlyIncomeBase: number;
  crCrcPerUsd: number;
  crSolidaristaPct: number;
  crPensionComplementariaPct: number;
  crEsppPct: number;
};

async function fetchSettings(): Promise<Settings> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("settings");
  return res.json();
}

const PIE_COLORS: Record<string, string> = {
  net: "var(--chart-income)",
  ccss: "#a78bfa",
  renta: "#f97316",
  solidarista: "#38bdf8",
  pension: "#c084fc",
  espp: "#94a3b8",
};

const PIE_LEGEND_DOT_CLASS: Record<string, string> = {
  net: "bg-[color:var(--chart-income)]",
  ccss: "bg-[#a78bfa]",
  renta: "bg-[#f97316]",
  solidarista: "bg-[#38bdf8]",
  pension: "bg-[#c084fc]",
  espp: "bg-[#94a3b8]",
};

type IncomePlannerPanelProps = {
  /** When set, emits expected net income in **base currency** whenever the calculator changes (gross, period, currency). */
  onLiveExpectedIncomeBase?: (amountBase: number) => void;
  compactNav?: boolean;
};

export function IncomePlannerPanel({
  onLiveExpectedIncomeBase,
  compactNav,
}: IncomePlannerPanelProps) {
  const qc = useQueryClient();
  const { data: settings, isPending } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const [grossStr, setGrossStr] = React.useState("850000");
  const [period, setPeriod] = React.useState<CrPayPeriod>("MONTHLY");
  const [inputCurrency, setInputCurrency] = React.useState<"CRC" | "USD">("CRC");

  const grossNum = Number.parseFloat(grossStr.replace(/,/g, "")) || 0;
  const crcUsd = settings?.crCrcPerUsd ?? 505;

  const voluntaryPct = React.useMemo(
    () => ({
      solidaristaPct: settings?.crSolidaristaPct ?? 0,
      pensionComplementariaPct: settings?.crPensionComplementariaPct ?? 0,
      esppPct: settings?.crEsppPct ?? 0,
    }),
    [settings],
  );

  const breakdown = React.useMemo(() => {
    if (!settings) return null;
    return computeCrSalary(grossNum, period, inputCurrency, crcUsd, voluntaryPct);
  }, [grossNum, period, inputCurrency, crcUsd, voluntaryPct, settings]);

  React.useEffect(() => {
    if (!onLiveExpectedIncomeBase || !settings || !breakdown) return;
    try {
      const base = liveNetCrcToExpectedIncomeBase({
        netMonthlyCrc: breakdown.netMonthlyCrc,
        baseCurrency: settings.baseCurrency,
        quoteCurrency: settings.quoteCurrency,
        quotePerBase: settings.quotePerBase,
        crCrcPerUsd: settings.crCrcPerUsd,
      });
      onLiveExpectedIncomeBase(base);
    } catch {
      /* keep saved profile as source of truth when CRC→base is not configured */
    }
  }, [onLiveExpectedIncomeBase, settings, breakdown]);

  const pieData = React.useMemo(() => {
    if (!breakdown) return [];
    const rows: { name: string; value: number; key: string }[] = [
      { name: "Take-home", value: Math.max(0, breakdown.netMonthlyCrc), key: "net" },
      { name: "CCSS", value: Math.max(0, breakdown.ccssMonthlyCrc), key: "ccss" },
      { name: "Income tax", value: Math.max(0, breakdown.rentaMonthlyCrc), key: "renta" },
      {
        name: "Solidarista",
        value: Math.max(0, breakdown.solidaristaMonthlyCrc),
        key: "solidarista",
      },
      {
        name: "Pensión compl.",
        value: Math.max(0, breakdown.pensionComplementariaMonthlyCrc),
        key: "pension",
      },
      { name: "ESPP / otro %", value: Math.max(0, breakdown.esppMonthlyCrc), key: "espp" },
    ];
    return rows.filter((r) => r.value > 0 || r.key === "net");
  }, [breakdown]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!settings || !breakdown) throw new Error("No settings");
      const baseAmount = plannedNetCrcToMonthlyIncomeBase({
        netMonthlyCrc: breakdown.netMonthlyCrc,
        baseCurrency: settings.baseCurrency,
        quoteCurrency: settings.quoteCurrency,
        quotePerBase: settings.quotePerBase,
        crCrcPerUsd: settings.crCrcPerUsd,
      });
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyIncomeBase: baseAmount }),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Saved planned net as monthly income in Settings");
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["analytics", "summary"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function fmtCrc(n: number) {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      maximumFractionDigits: 0,
    }).format(n);
  }

  const grossMonthlyCrc =
    breakdown?.grossMonthlyCrc ??
    grossMonthlyCrcFromInput(grossNum, period, inputCurrency, crcUsd);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Income planner</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted-fg)]">
            Costa Rica salaried estimates: CCSS obrero ({(CR_CCSS_EMPLOYEE_RATE_2026 * 100).toFixed(2)}% in
            2026), progressive Impuesto al Salario (2026), plus optional % deductions from Settings. For
            planning only — not tax advice.
          </p>
        </div>
        {!compactNav ? (
          <Button variant="outline" size="sm" asChild>
            <Link href="/">← Dashboard</Link>
          </Button>
        ) : null}
      </header>

      {isPending || !settings || !breakdown ? (
        <p className="text-sm text-[var(--muted-fg)]">Loading…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Salary calculator</CardTitle>
              <CardDescription>
                Gross salary (bruto). Bi-weekly = quincena (×2 to monthly gross). Percent deductions
                (Solidarista, pensión complementaria, ESPP) and{" "}
                <strong>CRC per 1 USD</strong> are configured in{" "}
                <Link href="/settings?tab=cr" className="underline-offset-2 hover:underline">
                  Settings → Costa Rica
                </Link>
                .
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={period === "MONTHLY" ? "default" : "outline"}
                  onClick={() => setPeriod("MONTHLY")}
                >
                  Monthly
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={period === "BIWEEKLY" ? "default" : "outline"}
                  onClick={() => setPeriod("BIWEEKLY")}
                >
                  Bi-weekly (quincenal)
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={inputCurrency === "CRC" ? "secondary" : "outline"}
                  onClick={() => setInputCurrency("CRC")}
                >
                  CRC
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={inputCurrency === "USD" ? "secondary" : "outline"}
                  onClick={() => setInputCurrency("USD")}
                >
                  USD
                </Button>
              </div>

              {inputCurrency === "USD" && (
                <p className="text-xs text-[var(--muted-fg)]">
                  Conversion: <strong>{crcUsd.toLocaleString()} CRC</strong> per 1 USD (Settings → Costa
                  Rica).
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="gross">
                  Gross salary ({period === "MONTHLY" ? "per month" : "per quincena"})
                </Label>
                <Input
                  id="gross"
                  inputMode="decimal"
                  value={grossStr}
                  onChange={(e) => setGrossStr(e.target.value)}
                  placeholder={inputCurrency === "CRC" ? "850000" : "1700"}
                />
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4 text-sm">
                <div className="grid gap-2 tabular-nums">
                  <Row label="Gross (monthly, CRC)" value={fmtCrc(breakdown.grossMonthlyCrc)} />
                  <Row label="CCSS (monthly)" value={fmtCrc(breakdown.ccssMonthlyCrc)} />
                  <Row label="Income tax (monthly)" value={fmtCrc(breakdown.rentaMonthlyCrc)} />
                  <Row
                    label="Asoc. solidarista"
                    value={fmtCrc(breakdown.solidaristaMonthlyCrc)}
                    hint={`${voluntaryPct.solidaristaPct}% of gross`}
                  />
                  <Row
                    label="Pensión complementaria"
                    value={fmtCrc(breakdown.pensionComplementariaMonthlyCrc)}
                    hint={`${voluntaryPct.pensionComplementariaPct}% of gross`}
                  />
                  <Row
                    label="ESPP / otro %"
                    value={fmtCrc(breakdown.esppMonthlyCrc)}
                    hint={`${voluntaryPct.esppPct}% of gross`}
                  />
                  <Row label="Net (monthly)" value={fmtCrc(breakdown.netMonthlyCrc)} strong />
                  <Row label="Net (per quincena)" value={fmtCrc(breakdown.netBiweeklyCrc)} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  disabled={saveMut.isPending || breakdown.netMonthlyCrc <= 0}
                  onClick={() => saveMut.mutate()}
                >
                  Save as income profile
                </Button>
                <span className="text-xs text-[var(--muted-fg)]">
                  Writes <strong>planned monthly net</strong> to Settings → Monthly income (
                  {settings.baseCurrency}) for forecast and dashboard.
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Where the money goes</CardTitle>
              <CardDescription>
                Monthly view in CRC — gross {fmtCrc(grossMonthlyCrc)} before deductions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mx-auto h-[280px] w-full max-w-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={PIE_COLORS[entry.key] ?? "#71717a"}
                          stroke="var(--card)"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => fmtCrc(typeof v === "number" ? v : Number(v))}
                      contentStyle={rechartsTooltipContentStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-[var(--muted-fg)]">
                {pieData.map((p) => (
                  <li key={p.key} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${PIE_LEGEND_DOT_CLASS[p.key] ?? "bg-[#71717a]"}`}
                      />
                      {p.name}
                    </span>
                    <span className="tabular-nums text-[var(--foreground)]">{fmtCrc(p.value)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-[var(--muted-fg)]">
        2026 salary brackets (monthly CRC): exempt up to ₡918,000; then 10% / 15% / 20% / 25% marginal bands
        to ₡4,727,000 and above. Official detail:{" "}
        <a
          className="underline-offset-2 hover:underline"
          href="https://www.hacienda.go.cr/docs/TramosRenta2026.pdf"
          target="_blank"
          rel="noreferrer"
        >
          Hacienda — Tramos de renta 2026 (PDF)
        </a>
        .
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  hint,
  strong,
}: {
  label: string;
  value: string;
  hint?: string;
  strong?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between gap-3">
        <span className={strong ? "font-medium text-[var(--foreground)]" : "text-[var(--muted-fg)]"}>
          {label}
        </span>
        <span className={strong ? "font-semibold text-[var(--foreground)]" : ""}>{value}</span>
      </div>
      {hint ? <p className="mt-0.5 text-[11px] text-[var(--muted-fg)]">{hint}</p> : null}
    </div>
  );
}
