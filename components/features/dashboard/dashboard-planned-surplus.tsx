import Link from "next/link"
import { MetricStat } from "@/components/patterns/metric-stat"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoneyBase } from "@/lib/shared/format-money"

type DashboardPlannedSurplusProps = {
  monthLabel: string | undefined
  bonusNames: string[]
  expectedMonthlyIncomeBase: number
  burnRate3Mo: number
  surplus: number
  baseCurrency: string
}

export function DashboardPlannedSurplus({
  monthLabel,
  bonusNames,
  expectedMonthlyIncomeBase,
  burnRate3Mo,
  surplus,
  baseCurrency,
}: DashboardPlannedSurplusProps) {
  return (
    <Card className="border-border bg-muted/10 border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Planned surplus</CardTitle>
        <CardDescription>
          Expected net income for {monthLabel ?? "this month"} (
          <Link href="/income" className="underline-offset-2 hover:underline">
            Income
          </Link>
          {bonusNames.length > 0 ? <> — includes {bonusNames.join(", ")}</> : null}) minus trailing
          3-month average expenses from{" "}
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
          value={formatMoneyBase(expectedMonthlyIncomeBase, baseCurrency)}
          valueClassName="text-xl font-semibold tabular-nums"
        />
        <MetricStat
          label="Avg monthly expenses (3 mo)"
          labelClassName="text-xs font-normal normal-case tracking-normal"
          value={formatMoneyBase(burnRate3Mo, baseCurrency)}
          valueClassName="text-xl font-semibold tabular-nums text-muted-foreground"
        />
        <div className="flex items-center gap-2">
          <Badge variant={surplus >= 0 ? "success" : "danger"}>
            Surplus {formatMoneyBase(surplus, baseCurrency)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
