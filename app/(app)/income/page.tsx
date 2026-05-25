"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { IncomeBonusesManager } from "@/components/features/income/income-bonuses-manager"
import type { IncomeBonusDto } from "@/components/features/income/income-bonuses-manager"
import { IncomePlannerPanel } from "@/components/features/income/income-planner-panel"
import { IncomeSurplusSidebar } from "@/components/features/income/income-surplus-sidebar"
import {
  deriveIncomeSurplusData,
  type IncomeSummary,
} from "@/components/features/income/income-surplus-data"
import { PageIntro } from "@/components/patterns/page-intro"
import { Separator } from "@/components/ui/separator"

async function fetchSummary() {
  const res = await fetch("/api/analytics/summary")
  if (!res.ok) throw new Error("summary")
  return res.json() as Promise<IncomeSummary>
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

  const surplusData = deriveIncomeSurplusData(liveIncomeBase, summary)

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
          <IncomeBonusesManager embedded crcPerUsd={surplusData.crcPerUsd} />
        </div>

        <div className="space-y-6">
          <IncomeSurplusSidebar
            monthLabel={surplusData.monthLabel}
            expectedIncome={surplusData.expectedIncome}
            burn={surplusData.burn}
            surplus={surplusData.surplus}
            baseCurrency={surplusData.baseCurrency}
            hasBonusesThisMonth={surplusData.hasBonusesThisMonth}
            bonusNames={surplusData.bonusNames}
          />
        </div>
      </div>
    </div>
  )
}
