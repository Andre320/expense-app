"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ForecastMilestones } from "@/components/forecast-milestones";
import { MONTH_LABELS } from "@/components/income-bonuses-manager";
import { MetricStat } from "@/components/patterns/metric-stat";
import { PageIntro } from "@/components/patterns/page-intro";
import { SavingsAccountsManager } from "@/components/savings-accounts-manager";
import { SavingsGoalsManager } from "@/components/savings-goals-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  goalsForForecast,
  monthlySurplusForForecast,
  savingsGoalMilestones,
  type SavingsGoalForecastInput,
} from "@/lib/forecast-planning";
import { formatMoneyBase } from "@/lib/format-money";
import { REPORTING_CURRENCY } from "@/lib/app-currency";

async function fetchSummary() {
  const res = await fetch("/api/analytics/summary");
  if (!res.ok) throw new Error("summary");
  return res.json() as Promise<{
    burnRate3Mo: number;
    expectedMonthlyIncomeBase: number;
    reportingCurrency: string;
    savingsAccountsTotal: number;
    forecastCalendarMonth: number;
    activeBonusesThisMonth: { name: string; grossAmountCrc: number }[];
    settings: { crCrcPerUsd: number };
  }>;
}

async function fetchGoals(): Promise<SavingsGoalForecastInput[]> {
  const res = await fetch("/api/savings");
  if (!res.ok) throw new Error("goals");
  return res.json();
}

export default function SavingsPage() {
  const { data: summary } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: fetchSummary,
  });
  const { data: goals } = useQuery({
    queryKey: ["savings"],
    queryFn: fetchGoals,
  });

  const expectedIncome = summary?.expectedMonthlyIncomeBase ?? 0;
  const burn = summary?.burnRate3Mo ?? 0;
  const surplus = monthlySurplusForForecast(
    Number.isFinite(expectedIncome) ? expectedIncome : 0,
    burn,
  );
  const crcPerUsd = summary?.settings.crCrcPerUsd ?? 505;
  const milestones =
    goals && goals.length
      ? savingsGoalMilestones(goalsForForecast(goals, crcPerUsd), surplus)
      : [];
  const bc = summary?.reportingCurrency ?? REPORTING_CURRENCY;
  const monthLabel =
    summary?.forecastCalendarMonth != null
      ? MONTH_LABELS[summary.forecastCalendarMonth - 1]
      : null;

  return (
    <div className="space-y-10">
      <PageIntro
        eyebrow="Financial planning"
        title="Savings"
        description={
          <>
            Track cash in savings accounts, earmark goals, and project time-to-target using this
            month&apos;s planned surplus from the{" "}
            <Link href="/income" className="underline-offset-2 hover:underline">
              Income
            </Link>{" "}
            tab minus trailing average spend from Activity.
          </>
        }
      />

      <SavingsAccountsManager
        reportingCurrency={bc}
        crcPerUsd={crcPerUsd}
      />

      <div className="grid gap-10 xl:grid-cols-[1fr_minmax(280px,360px)]">
        <SavingsGoalsManager />

        <div className="space-y-6">
          <Card className="border-border bg-muted/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Funding timeline</CardTitle>
              <CardDescription>
                Based on surplus for {monthLabel ?? "this month"} (
                {formatMoneyBase(expectedIncome, bc)} expected income −{" "}
                {formatMoneyBase(burn, bc)} avg spend). USD goals are converted at{" "}
                {crcPerUsd.toLocaleString()} CRC/USD. Lower priority number is funded first.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <MetricStat
                  label="Monthly surplus"
                  value={formatMoneyBase(surplus, bc)}
                  valueClassName="text-lg font-semibold tabular-nums"
                />
                <MetricStat
                  label="Avg expenses (3 mo)"
                  value={formatMoneyBase(burn, bc)}
                  valueClassName="text-lg font-semibold tabular-nums text-muted-foreground"
                />
              </div>
              <ForecastMilestones
                milestones={milestones}
                monthlySurplusBase={surplus}
                baseCurrency={bc}
              />
            </CardContent>
          </Card>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Surplus comes from your salary profile and fixed bonuses on{" "}
            <Link href="/income" className="underline-offset-2 hover:underline">
              Income
            </Link>
            . Actual cash when goals are funded still flows through Activity.
          </p>
        </div>
      </div>
    </div>
  );
}
