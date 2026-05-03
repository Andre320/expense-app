"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Summary = {
  monthly: { month: string; income: number; expense: number }[];
  burnRate3Mo: number;
  savingsTotal: number;
  settings: {
    baseCurrency: string;
    quoteCurrency: string;
    quotePerBase: number;
    currentBalanceBase: number;
    monthlyIncomeBase: number;
    monthlyDeductionsBase: number;
  };
};

async function fetchSummary(): Promise<Summary> {
  const res = await fetch("/api/analytics/summary");
  if (!res.ok) throw new Error("Failed to load summary");
  return res.json();
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function DashboardPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: fetchSummary,
  });

  if (isPending) {
    return (
      <div className="text-sm text-[var(--muted-fg)]">Loading command center…</div>
    );
  }
  if (isError || !data) {
    return (
      <div className="text-sm text-red-400">
        Could not load analytics. Is the database migrated?
      </div>
    );
  }

  const bc = data.settings.baseCurrency;
  const chartData = data.monthly.map((m) => ({
    ...m,
    label: m.month.slice(5),
  }));

  const netLast =
    data.monthly.length > 0
      ? data.monthly[data.monthly.length - 1]!.income -
        data.monthly[data.monthly.length - 1]!.expense
      : 0;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Command center</h1>
        <p className="max-w-2xl text-sm text-[var(--muted-fg)]">
          Burn rate, cash flow, and savings in {bc}. Rates and forecast inputs live in
          Settings.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current balance</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {fmt(data.settings.currentBalanceBase, bc)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[var(--muted-fg)]">
            Base currency ({bc})
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>3-mo avg spend</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {fmt(data.burnRate3Mo, bc)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[var(--muted-fg)]">
            Monthly expense burn
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last month net</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {fmt(netLast, bc)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Badge variant={netLast >= 0 ? "success" : "danger"}>
              {netLast >= 0 ? "Surplus" : "Deficit"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Savings goals</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {fmt(data.savingsTotal, bc)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[var(--muted-fg)]">
            Total across goals
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs expenses</CardTitle>
          <CardDescription>
            Monthly totals in {bc} — trailing twelve months
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[320px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="label" stroke="#71717a" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="#71717a"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(_, p) => {
                  const pl = p?.[0]?.payload as { month?: string } | undefined;
                  return pl?.month ?? "";
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="income"
                name="Income"
                fill="var(--chart-income)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="Expenses"
                fill="var(--chart-expense)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
