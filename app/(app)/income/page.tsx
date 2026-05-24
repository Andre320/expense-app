"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { IncomeBonusesManager, MONTH_LABELS } from "@/components/income-bonuses-manager"
import type { IncomeBonusDto } from "@/components/income-bonuses-manager"
import { IncomePlannerPanel } from "@/components/income-planner-panel"
import { MetricStat } from "@/components/patterns/metric-stat"
import { PageIntro } from "@/components/patterns/page-intro"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { monthlySurplusForForecast } from "@/lib/forecast-planning"
import { formatMoneyBase } from "@/lib/format-money"
import { REPORTING_CURRENCY } from "@/lib/app-currency"

async function fetchSummary() {
  const res = await fetch("/api/analytics/summary")
  if (!res.ok) throw new Error("summary")
  return res.json() as Promise<{
    burnRate3Mo: number
    expectedMonthlyIncomeBase: number
    reportingCurrency: string
    forecastCalendarMonth: number
    activeBonusesThisMonth: { name: string; grossAmountCrc: number }[]
    settings: { crCrcPerUsd: number }
  }>
}

async function fetchBonuses(): Promise<IncomeBonusDto[]> {
  const res = await fetch("/api/income-bonuses")
  if (!res.ok) throw new Error("bonuses")
  return res.json()
}

export default function IncomePage() {
  const [liveIncomeBase, setLiveIncomeBase] = React.useState<number | null>(null)

  const { data: summary } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: fetchSummary,
  })
  const { data: bonuses } = useQuery({
    queryKey: ["income-bonuses"],
    queryFn: fetchBonuses,
  })

  const expectedIncome = liveIncomeBase ?? summary?.expectedMonthlyIncomeBase ?? 0
  const burn = summary?.burnRate3Mo ?? 0
  const surplus = monthlySurplusForForecast(
    Number.isFinite(expectedIncome) ? expectedIncome : 0,
    burn,
  )
  const bc = summary?.reportingCurrency ?? REPORTING_CURRENCY
  const monthLabel =
    summary?.forecastCalendarMonth != null ? MONTH_LABELS[summary.forecastCalendarMonth - 1] : null
  const hasBonusesThisMonth = (summary?.activeBonusesThisMonth.length ?? 0) > 0

  return (
    <div className="space-y-10">
      <PageIntro
        eyebrow="Financial planning"
        title="Income"
        description={
          <>
            Salary and fixed bonuses for Costa Rica payroll planning. Surplus feeds savings
            forecasts on the{" "}
            <Link href="/savings" className="underline-offset-2 hover:underline">
              Savings
            </Link>{" "}
            tab.
          </>
        }
      />

      <div className="grid gap-10 xl:grid-cols-[1fr_minmax(280px,360px)]">
        <div className="space-y-10">
          <IncomePlannerPanel
            compactNav
            bonuses={bonuses ?? []}
            onLiveExpectedIncomeBase={(n) => setLiveIncomeBase(n)}
          />
          <Separator className="bg-border" />
          <IncomeBonusesManager embedded crcPerUsd={summary?.settings.crCrcPerUsd ?? 505} />
        </div>

        <div className="space-y-6">
          <Card className="border-border bg-muted/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">This month&apos;s surplus</CardTitle>
              <CardDescription>
                Expected income{monthLabel ? ` (${monthLabel})` : ""}:{" "}
                <strong>live from calculator</strong> when possible, else saved profile. Minus
                trailing 3-month average spend from Activity ({bc}).
                {hasBonusesThisMonth ? (
                  <> Includes {summary!.activeBonusesThisMonth.map((b) => b.name).join(", ")}.</>
                ) : null}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <MetricStat
                  label="Expected income"
                  value={formatMoneyBase(expectedIncome, bc)}
                  valueClassName="text-lg font-semibold tabular-nums"
                />
                <MetricStat
                  label="Avg expenses (3 mo)"
                  value={formatMoneyBase(burn, bc)}
                  valueClassName="text-lg font-semibold tabular-nums text-muted-foreground"
                />
                <MetricStat
                  label="Planned surplus"
                  value={formatMoneyBase(surplus, bc)}
                  valueClassName="text-lg font-semibold tabular-nums"
                />
              </div>
            </CardContent>
          </Card>

          <p className="text-muted-foreground text-xs leading-relaxed">
            Save your salary profile to persist gross, pay period, currency, and optional payroll
            deductions. Fixed bonuses repeat every year in the months you select. Set savings goals
            and see funding timelines on{" "}
            <Link href="/savings" className="underline-offset-2 hover:underline">
              Savings
            </Link>
            . USD exchange rate is under Settings → Currency.
          </p>
        </div>
      </div>
    </div>
  )
}
