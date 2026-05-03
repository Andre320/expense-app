"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { monthlyNet, projectedBalance } from "@/lib/forecast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function fetchSettings() {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("settings");
  return res.json() as Promise<{
    baseCurrency: string;
    currentBalanceBase: number;
    monthlyIncomeBase: number;
    monthlyDeductionsBase: number;
  }>;
}

export default function ForecastPage() {
  const { data: s } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });

  const [months, setMonths] = React.useState(12);
  const [savingsBoostPct, setSavingsBoostPct] = React.useState(0);

  const chart = React.useMemo(() => {
    if (!s) return [];
    const pts: { m: string; balance: number }[] = [];
    for (let n = 0; n <= months; n++) {
      pts.push({
        m: n === 0 ? "Now" : `+${n}m`,
        balance: projectedBalance(
          s.currentBalanceBase,
          s.monthlyIncomeBase,
          s.monthlyDeductionsBase,
          n,
          savingsBoostPct,
        ),
      });
    }
    return pts;
  }, [s, months, savingsBoostPct]);

  const net = s
    ? monthlyNet(
        s.monthlyIncomeBase,
        s.monthlyDeductionsBase,
        savingsBoostPct,
      )
    : 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Forecast</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted-fg)]">
          Projected balance uses your settings: current balance plus monthly net ×
          horizon. Tune “savings boost” to model routing more to savings (higher
          deductions).
        </p>
      </header>

      {!s ? (
        <p className="text-sm text-[var(--muted-fg)]">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Monthly net (adjusted)</CardDescription>
                <CardTitle className="text-xl tabular-nums">
                  {net.toLocaleString(undefined, {
                    style: "currency",
                    currency: s.baseCurrency,
                  })}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>End balance ({months} mo)</CardDescription>
                <CardTitle className="text-xl tabular-nums">
                  {chart[chart.length - 1]?.balance.toLocaleString(undefined, {
                    style: "currency",
                    currency: s.baseCurrency,
                  })}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Formula</CardDescription>
                <CardTitle className="text-xs font-normal leading-relaxed text-[var(--muted-fg)]">
                  Balance + (Income − Deductions × (1 + savings%)) × n
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>What-if</CardTitle>
              <CardDescription>
                Increase savings rate (adds to monthly deductions in the model).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="horizon">Horizon (months)</Label>
                <Input
                  id="horizon"
                  type="number"
                  min={1}
                  max={120}
                  value={months}
                  onChange={(e) => setMonths(Math.min(120, Math.max(1, Number(e.target.value) || 1)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boost">Savings boost (%)</Label>
                <Input
                  id="boost"
                  type="number"
                  step="1"
                  value={savingsBoostPct}
                  onChange={(e) => setSavingsBoostPct(Number(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trajectory</CardTitle>
              <CardDescription>In {s.baseCurrency}</CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="m" stroke="#71717a" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#71717a"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Projected"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
