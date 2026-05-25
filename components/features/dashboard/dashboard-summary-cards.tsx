import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoneyBase } from "@/lib/shared/format-money"

type DashboardSummaryCardsProps = {
  ledgerNetBalance: number
  savingsAccountsTotal: number
  burnRate3Mo: number
  netLast: number
  savingsTotal: number
  baseCurrency: string
}

export function DashboardSummaryCards({
  ledgerNetBalance,
  savingsAccountsTotal,
  burnRate3Mo,
  netLast,
  savingsTotal,
  baseCurrency,
}: DashboardSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Ledger net balance</CardDescription>
          <CardTitle className="text-xl tabular-nums">
            {formatMoneyBase(ledgerNetBalance, baseCurrency)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-xs">
          All-time income − expenses (Activity)
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Cash in savings accounts</CardDescription>
          <CardTitle className="text-xl tabular-nums">
            {formatMoneyBase(savingsAccountsTotal, baseCurrency)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-xs">
          <Link href="/savings" className="underline-offset-2 hover:underline">
            Actual balances
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>3-mo avg spend</CardDescription>
          <CardTitle className="text-xl tabular-nums">
            {formatMoneyBase(burnRate3Mo, baseCurrency)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-xs">Ledger burn rate</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Last month net</CardDescription>
          <CardTitle className="text-xl tabular-nums">
            {formatMoneyBase(netLast, baseCurrency)}
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
          <CardDescription>Goals (earmarked)</CardDescription>
          <CardTitle className="text-xl tabular-nums">
            {formatMoneyBase(savingsTotal, baseCurrency)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-xs">
          <Link href="/savings" className="underline-offset-2 hover:underline">
            Across goals
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
