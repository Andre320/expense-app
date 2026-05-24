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
  goalsForForecast,
  monthlySurplusForForecast,
  savingsGoalMilestones,
  type SavingsGoalForecastInput,
} from "@/lib/forecast-planning";
import { rechartsTooltipContentStyle } from "@/lib/chart-style";
import { REPORTING_CURRENCY } from "@/lib/app-currency";
import { formatMoneyBase } from "@/lib/format-money";
import { MONTH_LABELS } from "@/components/income-bonuses-manager";

type Summary = {
  monthly: { month: string; income: number; expense: number }[];
  burnRate3Mo: number;
  savingsTotal: number;
  savingsAccountsTotal?: number;
  expectedMonthlyIncomeBase: number;
  ledgerNetBalance: number;
  hasSalaryProfile: boolean;
  reportingCurrency: string;
  forecastCalendarMonth: number;
  activeBonusesThisMonth: { name: string; grossAmountCrc: number }[];
  settings: {
    crCrcPerUsd: number;
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
    return <div className="text-sm text-muted-foreground">Loading dashboard…</div>;
  }
  if (isError || !data) {
    return (
      <div className="text-sm text-red-400">
        Could not load analytics. Is the database migrated?
      </div>
    );
  }

  const bc = data.reportingCurrency ?? REPORTING_CURRENCY;
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
    data.expectedMonthlyIncomeBase,
    data.burnRate3Mo,
  );
  const crcPerUsd = data.settings?.crCrcPerUsd ?? 505;
  const milestones =
    goals && goals.length
      ? savingsGoalMilestones(goalsForForecast(goals, crcPerUsd), surplus)
      : [];

  const monthLabel =
    data.forecastCalendarMonth >= 1 && data.forecastCalendarMonth <= 12
      ? MONTH_LABELS[data.forecastCalendarMonth - 1]
      : undefined;
  const bonusNames = (data.activeBonusesThisMonth ?? []).map((b) => b.name);

  return (
    <div className="space-y-10">
      <PageIntro
        eyebrow="Overview"
        title="Dashboard"
        description={`Cash flow, planned surplus, savings timeline, and recent ledger entries in ${bc}.`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/savings">Savings</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/income">Income</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/activity">Activity</Link>
            </Button>
          </>
        }
      />

      {!data.hasSalaryProfile ? (
        <Card className="border-dashed border-border bg-muted/10">
          <CardContent className="py-4 text-sm text-muted-foreground">
            No salary profile saved yet. Set up gross salary and deductions on the{" "}
            <Link href="/income" className="font-medium text-foreground underline-offset-2 hover:underline">
              Income
            </Link>{" "}
            tab to enable planned surplus forecasting.
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-dashed border-border bg-muted/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Planned surplus</CardTitle>
          <CardDescription>
            Expected net income for {monthLabel ?? "this month"} (
            <Link href="/income" className="underline-offset-2 hover:underline">
              Income
            </Link>
            {bonusNames.length > 0 ? (
              <> — includes {bonusNames.join(", ")}</>
            ) : null}
            ) minus trailing 3-month average expenses from{" "}
            <Link href="/activity" className="underline-offset-2 hover:underline">
              Activity
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <MetricStat
            label={`Expected income (${monthLabel ?? "this month"})`}
            labelClassName="text-xs font-normal normal-case tracking-normal"
            value={formatMoneyBase(data.expectedMonthlyIncomeBase, bc)}
            valueClassName="text-xl font-semibold tabular-nums"
          />
          <MetricStat
            label="Avg monthly expenses (3 mo)"
            labelClassName="text-xs font-normal normal-case tracking-normal"
            value={formatMoneyBase(data.burnRate3Mo, bc)}
            valueClassName="text-xl font-semibold tabular-nums text-muted-foreground"
          />
          <div className="flex items-center gap-2">
            <Badge variant={surplus >= 0 ? "success" : "danger"}>
              Surplus {formatMoneyBase(surplus, bc)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ledger net balance</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {formatMoneyBase(data.ledgerNetBalance, bc)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            All-time income − expenses (Activity)
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cash in savings accounts</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {formatMoneyBase(data.savingsAccountsTotal ?? 0, bc)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <Link href="/savings" className="underline-offset-2 hover:underline">
              Actual balances
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>3-mo avg spend</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {formatMoneyBase(data.burnRate3Mo, bc)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Ledger burn rate</CardContent>
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
            <CardDescription>Goals (earmarked)</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {formatMoneyBase(data.savingsTotal, bc)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <Link href="/savings" className="underline-offset-2 hover:underline">
              Across goals
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Savings forecast</CardTitle>
            <CardDescription>
              Sequential funding by priority. Manage goals on the{" "}
              <Link href="/savings" className="underline-offset-2 hover:underline">
                Savings
              </Link>{" "}
              tab; income comes from{" "}
              <Link href="/income" className="underline-offset-2 hover:underline">
                Income
              </Link>
              .
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
        <CardContent className="h-[300px] min-h-[300px] pt-2">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
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
