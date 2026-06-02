"use client"

import Link from "next/link"
import { PageIntro } from "@/components/patterns/page-intro"
import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
import { SavingsAccountsManager } from "@/components/features/savings/savings-accounts-manager"
import { SavingsFundingTimeline } from "@/components/features/savings/savings-funding-timeline"
import { SavingsGoalsManager } from "@/components/features/savings/savings-goals-manager"
import { useSavingsPageData } from "@/components/features/savings/use-savings-page-data"

export default function SavingsPage() {
  const {
    summaryQuery,
    goalsQuery,
    expectedIncome,
    burn,
    surplus,
    milestones,
    baseCurrency,
    monthLabel,
    crcPerUsd,
  } = useSavingsPageData()

  if (summaryQuery.isError) {
    return (
      <div className="space-y-8">
        <PageIntro
          eyebrow="Financial planning"
          title="Savings"
          description="Accounts, goals, and funding timeline."
        />
        <QueryErrorPanel
          title="Could not load savings forecast"
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

      <SavingsAccountsManager reportingCurrency={baseCurrency} crcPerUsd={crcPerUsd} />

      <div className="grid gap-10 xl:grid-cols-[1fr_minmax(280px,360px)]">
        <SavingsGoalsManager />

        <div className="space-y-6">
          {goalsQuery.isError ? (
            <QueryErrorPanel
              title="Could not load goals"
              message={goalsQuery.error?.message ?? "Goals are unavailable."}
              onRetry={() => void goalsQuery.refetch()}
            />
          ) : (
            <SavingsFundingTimeline
              monthLabel={monthLabel ?? null}
              expectedIncome={expectedIncome}
              burn={burn}
              surplus={surplus}
              milestones={milestones}
              baseCurrency={baseCurrency}
              crcPerUsd={crcPerUsd}
            />
          )}
        </div>
      </div>
    </div>
  )
}
