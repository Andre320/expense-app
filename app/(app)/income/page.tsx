"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { IncomeBonusesManager } from "@/components/features/income/income-bonuses-manager"
import { IncomeProfilesManager } from "@/components/features/income/income-profiles-manager"
import type { IncomeBonusDto } from "@/components/features/income/income-bonuses-manager"
import { IncomePlannerPanel } from "@/components/features/income/income-planner-panel"
import { IncomeSurplusSidebar } from "@/components/features/income/income-surplus-sidebar"
import {
  deriveIncomeSurplusData,
  type IncomeSummary,
} from "@/components/features/income/income-surplus-data"
import { PageIntro } from "@/components/patterns/page-intro"
import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
import { Separator } from "@/components/ui/separator"
import { fetchJson } from "@/lib/shared/api-error"

export default function IncomePage() {
  const [liveIncomeBase, setLiveIncomeBase] = React.useState<number | null>(null)

  const summaryQuery = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => fetchJson<IncomeSummary>("/api/analytics/summary"),
  })
  const bonusesQuery = useQuery({
    queryKey: ["income-bonuses"],
    queryFn: () => fetchJson<IncomeBonusDto[]>("/api/income-bonuses"),
  })

  const summary = summaryQuery.data
  const bonuses = bonusesQuery.data
  const surplusData = deriveIncomeSurplusData(liveIncomeBase, summary)

  if (summaryQuery.isError) {
    return (
      <div className="space-y-8">
        <PageIntro
          eyebrow="Financial planning"
          title="Income"
          description="Salary, bonuses, and surplus for savings forecasts."
        />
        <QueryErrorPanel
          title="Could not load income summary"
          message={summaryQuery.error?.message ?? "Analytics are unavailable."}
          onRetry={() => void summaryQuery.refetch()}
        />
      </div>
    )
  }

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

      {bonusesQuery.isError ? (
        <QueryErrorPanel
          title="Could not load bonuses"
          message={bonusesQuery.error?.message ?? "Bonus list is unavailable."}
          onRetry={() => void bonusesQuery.refetch()}
        />
      ) : null}

      <div className="grid gap-10 xl:grid-cols-[1fr_minmax(280px,360px)]">
        <div className="space-y-10">
          <IncomeProfilesManager />
          <Separator className="bg-border" />
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
