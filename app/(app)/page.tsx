"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ForecastMilestones } from "@/components/forecast-milestones"
import { PageIntro } from "@/components/patterns/page-intro"
import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
import { RecentLedger } from "@/components/features/transactions/recent-ledger"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardPlannedSurplus } from "@/components/features/dashboard/dashboard-planned-surplus"
import { DashboardSummaryCards } from "@/components/features/dashboard/dashboard-summary-cards"
import { DashboardMonthlyChart } from "@/components/features/dashboard/dashboard-monthly-chart"
import {
  deriveDashboardData,
  type DashboardSummary,
} from "@/components/features/dashboard/use-dashboard-data"
import type { SavingsGoalForecastInput } from "@/lib/planning/forecast-planning"
import { fetchJson } from "@/lib/shared/api-error"

async function fetchSummary(): Promise<DashboardSummary> {
  return fetchJson("/api/analytics/summary")
}

async function fetchGoals(): Promise<SavingsGoalForecastInput[]> {
  return fetchJson("/api/savings")
}

export default function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: fetchSummary,
  })
  const goalsQuery = useQuery({
    queryKey: ["savings"],
    queryFn: fetchGoals,
  })

  const { data, isPending, isError, error, refetch } = summaryQuery

  if (isPending) {
    return <div className="text-muted-foreground text-sm">Loading dashboard…</div>
  }

  if (isError || !data) {
    return (
      <div className="space-y-8">
        <PageIntro
          eyebrow="Overview"
          title="Dashboard"
          description="Cash flow, planned surplus, savings timeline, and recent ledger entries."
        />
        <QueryErrorPanel
          title="Could not load dashboard"
          message={error?.message ?? "Analytics are unavailable."}
          onRetry={() => void refetch()}
        />
      </div>
    )
  }

  const { baseCurrency, chartData, netLast, surplus, milestones, monthLabel, bonusNames } =
    deriveDashboardData(data, goalsQuery.data)

  return (
    <div className="space-y-10">
      <PageIntro
        eyebrow="Overview"
        title="Dashboard"
        description={`Cash flow, planned surplus, savings timeline, and recent ledger entries in ${baseCurrency}.`}
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

      {goalsQuery.isError ? (
        <QueryErrorPanel
          title="Could not load savings goals"
          message={goalsQuery.error?.message ?? "Forecast milestones may be incomplete."}
          onRetry={() => void goalsQuery.refetch()}
        />
      ) : null}

      {!data.hasSalaryProfile ? (
        <Card className="border-border bg-muted/10 border-dashed">
          <CardContent className="text-muted-foreground py-4 text-sm">
            No salary profile saved yet. Set up gross salary and deductions on the{" "}
            <Link
              href="/income"
              className="text-foreground font-medium underline-offset-2 hover:underline"
            >
              Income
            </Link>{" "}
            tab to enable planned surplus forecasting.
          </CardContent>
        </Card>
      ) : null}

      <DashboardPlannedSurplus
        monthLabel={monthLabel}
        bonusNames={bonusNames}
        expectedMonthlyIncomeBase={data.expectedMonthlyIncomeBase}
        burnRate3Mo={data.burnRate3Mo}
        surplus={surplus}
        baseCurrency={baseCurrency}
      />

      <DashboardSummaryCards
        ledgerNetBalance={data.ledgerNetBalance}
        savingsAccountsTotal={data.savingsAccountsTotal ?? 0}
        burnRate3Mo={data.burnRate3Mo}
        netLast={netLast}
        savingsTotal={data.savingsTotal}
        baseCurrency={baseCurrency}
      />

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
              baseCurrency={baseCurrency}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent ledger</CardTitle>
            <CardDescription>Latest movements — open full table to edit.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentLedger baseCurrency={baseCurrency} />
          </CardContent>
        </Card>
      </div>

      <DashboardMonthlyChart
        chartData={chartData}
        baseCurrency={baseCurrency}
        hasSalaryProfile={data.hasSalaryProfile}
      />
    </div>
  )
}
