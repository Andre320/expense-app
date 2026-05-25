"use client"

import Link from "next/link"
import { InsetPanel } from "@/components/patterns/inset-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CrPayPeriod } from "@/lib/income/tax-calculator"
import type { UseMutationResult } from "@tanstack/react-query"
import { fmtCrc } from "./use-income-planner"
import type { computeCrSalary } from "@/lib/income/tax-calculator"
import { BreakdownRow, CurrencyToggle } from "./planner-form.parts"

type Breakdown = ReturnType<typeof computeCrSalary>

export type PlannerFormProps = {
  grossStr: string
  onGrossStrChange: (value: string) => void
  period: CrPayPeriod
  onPeriodChange: (period: CrPayPeriod) => void
  inputCurrency: "CRC" | "USD"
  onInputCurrencyChange: (currency: "CRC" | "USD") => void
  solidaristaPct: string
  onSolidaristaPctChange: (value: string) => void
  pensionPct: string
  onPensionPctChange: (value: string) => void
  esppPct: string
  onEsppPctChange: (value: string) => void
  grossNum: number
  crcUsd: number
  voluntaryPct: {
    solidaristaPct: number
    pensionComplementariaPct: number
    esppPct: number
  }
  breakdown: Breakdown
  saveMut: UseMutationResult<unknown, Error, void, unknown>
}

export function PlannerForm({
  grossStr,
  onGrossStrChange,
  period,
  onPeriodChange,
  inputCurrency,
  onInputCurrencyChange,
  solidaristaPct,
  onSolidaristaPctChange,
  pensionPct,
  onPensionPctChange,
  esppPct,
  onEsppPctChange,
  grossNum,
  crcUsd,
  voluntaryPct,
  breakdown,
  saveMut,
}: PlannerFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Salary calculator</CardTitle>
        <CardDescription>
          Gross salary (bruto). Bi-weekly = quincena (×2 to monthly gross). USD gross uses the
          exchange rate from{" "}
          <Link href="/settings?tab=currency" className="underline-offset-2 hover:underline">
            Settings → Currency
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <PeriodToggle period={period} onPeriodChange={onPeriodChange} />
        <CurrencyToggle currency={inputCurrency} onCurrencyChange={onInputCurrencyChange} />

        {inputCurrency === "USD" && (
          <p className="text-muted-foreground text-xs">
            Conversion: <strong>{crcUsd.toLocaleString()} CRC</strong> per 1 USD (
            <Link href="/settings?tab=currency" className="underline-offset-2 hover:underline">
              Settings → Currency
            </Link>
            ).
          </p>
        )}

        <InsetPanel className="space-y-3 p-4">
          <p className="text-sm font-medium">Optional payroll deductions (% of gross)</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="solidaristaPct">Solidarista</Label>
              <Input
                id="solidaristaPct"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={solidaristaPct}
                onChange={(e) => onSolidaristaPctChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pensionPct">Pensión compl.</Label>
              <Input
                id="pensionPct"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={pensionPct}
                onChange={(e) => onPensionPctChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="esppPct">ESPP / otro</Label>
              <Input
                id="esppPct"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={esppPct}
                onChange={(e) => onEsppPctChange(e.target.value)}
              />
            </div>
          </div>
        </InsetPanel>

        <div className="space-y-2">
          <Label htmlFor="gross">
            Gross salary ({period === "MONTHLY" ? "per month" : "per quincena"})
          </Label>
          <Input
            id="gross"
            inputMode="decimal"
            value={grossStr}
            onChange={(e) => onGrossStrChange(e.target.value)}
            placeholder={inputCurrency === "CRC" ? "850000" : "1700"}
          />
        </div>

        <InsetPanel className="p-4 text-sm">
          <div className="grid gap-2 tabular-nums">
            <BreakdownRow label="Gross (monthly, CRC)" value={fmtCrc(breakdown.grossMonthlyCrc)} />
            <BreakdownRow label="CCSS (monthly)" value={fmtCrc(breakdown.ccssMonthlyCrc)} />
            <BreakdownRow label="Income tax (monthly)" value={fmtCrc(breakdown.rentaMonthlyCrc)} />
            <BreakdownRow
              label="Asoc. solidarista"
              value={fmtCrc(breakdown.solidaristaMonthlyCrc)}
              hint={`${voluntaryPct.solidaristaPct}% of gross`}
            />
            <BreakdownRow
              label="Pensión complementaria"
              value={fmtCrc(breakdown.pensionComplementariaMonthlyCrc)}
              hint={`${voluntaryPct.pensionComplementariaPct}% of gross`}
            />
            <BreakdownRow
              label="ESPP / otro %"
              value={fmtCrc(breakdown.esppMonthlyCrc)}
              hint={`${voluntaryPct.esppPct}% of gross`}
            />
            <BreakdownRow label="Net (monthly)" value={fmtCrc(breakdown.netMonthlyCrc)} strong />
            <BreakdownRow label="Net (per quincena)" value={fmtCrc(breakdown.netBiweeklyCrc)} />
          </div>
        </InsetPanel>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={saveMut.isPending || grossNum <= 0}
            onClick={() => saveMut.mutate()}
          >
            Save as income profile
          </Button>
          <span className="text-muted-foreground text-xs">
            Saves gross salary, pay period, currency, and optional payroll %.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function PeriodToggle({
  period,
  onPeriodChange,
}: {
  period: CrPayPeriod
  onPeriodChange: (period: CrPayPeriod) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant={period === "MONTHLY" ? "default" : "outline"}
        onClick={() => onPeriodChange("MONTHLY")}
      >
        Monthly
      </Button>
      <Button
        type="button"
        size="sm"
        variant={period === "BIWEEKLY" ? "default" : "outline"}
        onClick={() => onPeriodChange("BIWEEKLY")}
      >
        Bi-weekly (quincenal)
      </Button>
    </div>
  )
}
