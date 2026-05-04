"use client";

import Link from "next/link";
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
import { ForecastMilestones } from "@/components/forecast-milestones";
import { MetricStat } from "@/components/patterns/metric-stat";
import { PageIntro } from "@/components/patterns/page-intro";
import { RecentLedger } from "@/components/recent-ledger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  monthlySurplusForForecast,
  savingsGoalMilestones,
  type SavingsGoalForecastInput,
} from "@/lib/forecast-planning";
import { rechartsTooltipContentStyle } from "@/lib/chart-style";
import { formatMoneyBase } from "@/lib/format-money";

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

async function fetchGoals(): Promise<SavingsGoalForecastInput[]> {
  const res = await fetch("/api/savings");
  if (!res.ok) throw new Error("goals");
  return res.json();
}

export default function DashboardPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: fetchSummary,
  });
  const { data: goals } = useQuery({
    queryKey: ["savings"],
    queryFn: fetchGoals,
  });

  if (isPending) {
    return <div className="text-sm text-[var(--muted-fg)]">Loading dashboard…</div>;
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

  const surplus = monthlySurplusForForecast(
    data.settings.monthlyIncomeBase,
    data.burnRate3Mo,
  );
  const milestones =
    goals && goals.length ? savingsGoalMilestones(goals, surplus) : [];

  return (
    <div className="space-y-10">
      <PageIntro
        eyebrow="Overview"
        title="Dashboard"
        description={`Cash flow, planned surplus, savings timeline, and recent ledger entries in ${bc}.`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/planner">Planner</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/activity">Activity</Link>
            </Button>
          </>
        }
      />

      <Card className="border-dashed border-[var(--border)] bg-[var(--muted)]/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Planned surplus</CardTitle>
          <CardDescription>
            Expected net income (Settings /{" "}
            <Link href="/planner" className="underline-offset-2 hover:underline">
              Planner
            </Link>
            ) minus trailing 3-month average expenses from the ledger.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <MetricStat
            label="Expected monthly income"
            labelClassName="text-xs font-normal normal-case tracking-normal"
            value={formatMoneyBase(data.settings.monthlyIncomeBase, bc)}
            valueClassName="text-xl font-semibold tabular-nums"
          />
          <MetricStat
            label="Avg monthly expenses (3 mo)"
            labelClassName="text-xs font-normal normal-case tracking-normal"
            value={formatMoneyBase(data.burnRate3Mo, bc)}
            valueClassName="text-xl font-semibold tabular-nums text-[var(--muted-fg)]"
          />
          <div className="flex items-center gap-2">
            <Badge variant={surplus >= 0 ? "success" : "danger"}>
              Surplus {formatMoneyBase(surplus, bc)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current balance</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {formatMoneyBase(data.settings.currentBalanceBase, bc)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[var(--muted-fg)]">Base ({bc})</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>3-mo avg spend</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {formatMoneyBase(data.burnRate3Mo, bc)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[var(--muted-fg)]">Ledger burn rate</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last month net</CardDescription>
            <CardTitle className="text-xl tabular-nums">{formatMoneyBase(netLast, bc)}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Badge variant={netLast >= 0 ? "success" : "danger"}>
              {netLast >= 0 ? "Surplus" : "Deficit"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Savings (current)</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {formatMoneyBase(data.savingsTotal, bc)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[var(--muted-fg)]">Across goals</CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Savings forecast</CardTitle>
            <CardDescription>
              Sequential funding by priority. Tune income and goals in the planner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForecastMilestones
              milestones={milestones}
              monthlySurplusBase={surplus}
              baseCurrency={bc}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent ledger</CardTitle>
            <CardDescription>Latest movements — open full table to edit.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentLedger baseCurrency={bc} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs expenses</CardTitle>
          <CardDescription>Monthly totals in {bc} — trailing twelve months</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] pt-2">
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
                contentStyle={rechartsTooltipContentStyle}
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
