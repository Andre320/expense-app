"use client"

import Link from "next/link"
import { PageIntro } from "@/components/patterns/page-intro"
import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
import { Button } from "@/components/ui/button"
import { CR_CCSS_EMPLOYEE_RATE_2026 } from "@/lib/income/tax-calculator"
import type { IncomeBonusDto } from "@/components/features/income/income-bonuses-manager"
import { PlannerForm } from "./planner-form"
import { SalarySummary } from "./salary-summary"
import { useIncomePlannerForm, useSettingsQuery, type Settings } from "./use-income-planner"

type IncomePlannerPanelProps = {
  /** When set, emits expected net income in CRC whenever the calculator changes (includes bonuses this month). */
  onLiveExpectedIncomeBase?: (amountBase: number) => void
  compactNav?: boolean
  bonuses?: IncomeBonusDto[]
}

export function IncomePlannerPanel({
  onLiveExpectedIncomeBase,
  compactNav,
  bonuses = [],
}: IncomePlannerPanelProps) {
  const { data: settings, dataUpdatedAt, isPending, isError, error, refetch } = useSettingsQuery()

  return (
    <div className="space-y-8">
      <PageIntro
        title="Salary calculator"
        description={
          <>
            Costa Rica salaried estimates: CCSS obrero (
            {(CR_CCSS_EMPLOYEE_RATE_2026 * 100).toFixed(2)}% in 2026), progressive Impuesto al
            Salario (2026), plus optional payroll % below. For planning only — not tax advice.
          </>
        }
        actions={
          !compactNav ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/">← Dashboard</Link>
            </Button>
          ) : undefined
        }
      />

      {isPending ? (
        <p className="text-muted-foreground text-sm">Loading saved profile…</p>
      ) : isError ? (
        <QueryErrorPanel
          title="Could not load saved profile"
          message={error?.message ?? "Salary settings are unavailable."}
          onRetry={() => void refetch()}
        />
      ) : settings ? (
        <IncomePlannerContent
          key={dataUpdatedAt}
          settings={settings}
          bonuses={bonuses}
          onLiveExpectedIncomeBase={onLiveExpectedIncomeBase}
        />
      ) : null}

      <p className="text-muted-foreground text-[11px] leading-relaxed">
        2026 salary brackets (monthly CRC): exempt up to ₡918,000; then 10% / 15% / 20% / 25%
        marginal bands to ₡4,727,000 and above. Official detail:{" "}
        <a
          className="underline-offset-2 hover:underline"
          href="https://www.hacienda.go.cr/docs/TramosRenta2026.pdf"
          target="_blank"
          rel="noreferrer"
        >
          Hacienda — Tramos de renta 2026 (PDF)
        </a>
        .
      </p>
    </div>
  )
}

function IncomePlannerContent({
  settings,
  bonuses,
  onLiveExpectedIncomeBase,
}: {
  settings: Settings
  bonuses: IncomeBonusDto[]
  onLiveExpectedIncomeBase?: (amountBase: number) => void
}) {
  const planner = useIncomePlannerForm({ settings, bonuses, onLiveExpectedIncomeBase })

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PlannerForm
        grossStr={planner.grossStr}
        onGrossStrChange={planner.setGrossStr}
        period={planner.period}
        onPeriodChange={planner.setPeriod}
        inputCurrency={planner.inputCurrency}
        onInputCurrencyChange={planner.setInputCurrency}
        solidaristaPct={planner.solidaristaPct}
        onSolidaristaPctChange={planner.setSolidaristaPct}
        pensionPct={planner.pensionPct}
        onPensionPctChange={planner.setPensionPct}
        esppPct={planner.esppPct}
        onEsppPctChange={planner.setEsppPct}
        grossNum={planner.grossNum}
        crcUsd={planner.crcUsd}
        voluntaryPct={planner.voluntaryPct}
        breakdown={planner.breakdown}
        saveMut={planner.saveMut}
      />
      <SalarySummary pieData={planner.pieData} grossMonthlyCrc={planner.grossMonthlyCrc} />
    </div>
  )
}
