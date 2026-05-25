import Link from "next/link"
import { MetricStat } from "@/components/patterns/metric-stat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoneyBase } from "@/lib/shared/format-money"

type IncomeSurplusSidebarProps = {
  monthLabel: string | null | undefined
  expectedIncome: number
  burn: number
  surplus: number
  baseCurrency: string
  hasBonusesThisMonth: boolean
  bonusNames: string[]
}

export function IncomeSurplusSidebar({
  monthLabel,
  expectedIncome,
  burn,
  surplus,
  baseCurrency,
  hasBonusesThisMonth,
  bonusNames,
}: IncomeSurplusSidebarProps) {
  return (
    <>
      <Card className="border-border bg-muted/15">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">This month&apos;s surplus</CardTitle>
          <CardDescription>
            Expected income{monthLabel ? ` (${monthLabel})` : ""}:{" "}
            <strong>live from calculator</strong> when possible, else saved profile. Minus trailing
            3-month average spend from Activity ({baseCurrency}).
            {hasBonusesThisMonth ? <> Includes {bonusNames.join(", ")}.</> : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <MetricStat
              label="Expected income"
              value={formatMoneyBase(expectedIncome, baseCurrency)}
              valueClassName="text-lg font-semibold tabular-nums"
            />
            <MetricStat
              label="Avg expenses (3 mo)"
              value={formatMoneyBase(burn, baseCurrency)}
              valueClassName="text-lg font-semibold tabular-nums text-muted-foreground"
            />
            <MetricStat
              label="Planned surplus"
              value={formatMoneyBase(surplus, baseCurrency)}
              valueClassName="text-lg font-semibold tabular-nums"
            />
          </div>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs leading-relaxed">
        Save your salary profile to persist gross, pay period, currency, and optional payroll
        deductions. Fixed bonuses repeat every year in the months you select. Set savings goals and
        see funding timelines on{" "}
        <Link href="/savings" className="underline-offset-2 hover:underline">
          Savings
        </Link>
        . USD exchange rate is under Settings → Currency.
      </p>
    </>
  )
}
