"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CrPayPeriod } from "@/lib/income/tax-calculator"
import type { UseMutationResult } from "@tanstack/react-query"
import type { computeCrSalary } from "@/lib/income/tax-calculator"
import {
  CurrencyToggle,
  PeriodToggle,
  SalaryBreakdownPanel,
  VoluntaryDeductionsFields,
} from "./planner-form.parts"

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

        <VoluntaryDeductionsFields
          solidaristaPct={solidaristaPct}
          onSolidaristaPctChange={onSolidaristaPctChange}
          pensionPct={pensionPct}
          onPensionPctChange={onPensionPctChange}
          esppPct={esppPct}
          onEsppPctChange={onEsppPctChange}
        />

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

        <SalaryBreakdownPanel breakdown={breakdown} voluntaryPct={voluntaryPct} />

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
