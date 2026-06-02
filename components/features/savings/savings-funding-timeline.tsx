"use client"

import Link from "next/link"
import { ForecastMilestones } from "@/components/forecast-milestones"
import { MetricStat } from "@/components/patterns/metric-stat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { GoalMilestone } from "@/lib/planning/forecast-planning"
import { formatMoneyBase } from "@/lib/shared/format-money"

type Props = {
  monthLabel: string | null
  expectedIncome: number
  burn: number
  surplus: number
  milestones: GoalMilestone[]
  baseCurrency: string
  crcPerUsd: number
}

export function SavingsFundingTimeline({
  monthLabel,
  expectedIncome,
  burn,
  surplus,
  milestones,
  baseCurrency,
  crcPerUsd,
}: Props) {
  return (
    <div className="space-y-6">
      <Card className="border-border bg-muted/15">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Funding timeline</CardTitle>
          <CardDescription>
            Based on surplus for {monthLabel ?? "this month"} (
            {formatMoneyBase(expectedIncome, baseCurrency)} expected income −{" "}
            {formatMoneyBase(burn, baseCurrency)} avg spend). USD goals are converted at{" "}
            {crcPerUsd.toLocaleString()} CRC/USD. Lower priority number is funded first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <MetricStat
              label="Monthly surplus"
              value={formatMoneyBase(surplus, baseCurrency)}
              valueClassName="text-lg font-semibold tabular-nums"
            />
            <MetricStat
              label="Avg expenses (3 mo)"
              value={formatMoneyBase(burn, baseCurrency)}
              valueClassName="text-lg font-semibold tabular-nums text-muted-foreground"
            />
          </div>
          <ForecastMilestones
            milestones={milestones}
            monthlySurplusBase={surplus}
            baseCurrency={baseCurrency}
          />
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs leading-relaxed">
        Surplus comes from your salary profile and fixed bonuses on{" "}
        <Link href="/income" className="underline-offset-2 hover:underline">
          Income
        </Link>
        . Actual cash when goals are funded still flows through Activity.
      </p>
    </div>
  )
}
