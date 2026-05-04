"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ForecastMilestones } from "@/components/forecast-milestones";
import { IncomePlannerPanel } from "@/components/income-planner-panel";
import { SavingsGoalsManager } from "@/components/savings-goals-manager";
import { MetricStat } from "@/components/patterns/metric-stat";
import { PageIntro } from "@/components/patterns/page-intro";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  monthlySurplusForForecast,
  savingsGoalMilestones,
  type SavingsGoalForecastInput,
} from "@/lib/forecast-planning";
import { formatMoneyBase } from "@/lib/format-money";

async function fetchSummary() {
  const res = await fetch("/api/analytics/summary");
  if (!res.ok) throw new Error("summary");
  return res.json() as Promise<{
    burnRate3Mo: number;
    settings: { monthlyIncomeBase: number; baseCurrency: string };
  }>;
}

async function fetchGoals(): Promise<SavingsGoalForecastInput[]> {
  const res = await fetch("/api/savings");
  if (!res.ok) throw new Error("goals");
  return res.json();
}

export default function PlannerPage() {
  const [liveIncomeBase, setLiveIncomeBase] = React.useState<number | null>(null);

  const { data: summary } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: fetchSummary,
  });
  const { data: goals } = useQuery({
    queryKey: ["savings"],
    queryFn: fetchGoals,
  });

  const expectedIncome = liveIncomeBase ?? summary?.settings.monthlyIncomeBase ?? 0;
  const incomeNum = expectedIncome;
  const burn = summary?.burnRate3Mo ?? 0;
  const surplus = monthlySurplusForForecast(
    Number.isFinite(incomeNum) ? incomeNum : 0,
    burn,
  );
  const milestones =
    goals && goals.length
      ? savingsGoalMilestones(goals, surplus)
      : [];
  const bc = summary?.settings.baseCurrency ?? "USD";

  return (
    <div className="space-y-10">
      <PageIntro
        eyebrow="Financial planning"
        title="Planner"
        description={
          <>
            Income estimate, savings goals, and time-to-target using monthly surplus (expected net
            income minus trailing 3-month average expenses). Adjust gross salary — months to goal update
            live when a net can be converted to your base currency.
          </>
        }
      />

      <div className="grid gap-10 xl:grid-cols-[1fr_minmax(280px,360px)]">
        <div className="space-y-10">
          <IncomePlannerPanel
            compactNav
            onLiveExpectedIncomeBase={(n) => setLiveIncomeBase(n)}
          />
          <Separator className="bg-[var(--border)]" />
          <SavingsGoalsManager embedded />
        </div>

        <div className="space-y-6">
          <Card className="border-[var(--border)] bg-[var(--muted)]/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Surplus & timeline</CardTitle>
              <CardDescription>
                Expected income: <strong>live from calculator</strong> when possible, else saved
                monthly income. Surplus = that minus avg spend ({bc}).
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
                  valueClassName="text-lg font-semibold tabular-nums text-[var(--muted-fg)]"
                />
              </div>
              <ForecastMilestones
                milestones={milestones}
                monthlySurplusBase={surplus}
                baseCurrency={bc}
              />
            </CardContent>
          </Card>

          <p className="text-xs leading-relaxed text-[var(--muted-fg)]">
            Save your net from the calculator to persist expected income. CR rates and % deductions live
            under Settings → Costa Rica.
          </p>
        </div>
      </div>
    </div>
  );
}
