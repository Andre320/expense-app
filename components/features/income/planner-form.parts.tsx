import { InsetPanel } from "@/components/patterns/inset-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CrPayPeriod } from "@/lib/income/tax-calculator"
import type { computeCrSalary } from "@/lib/income/tax-calculator"
import { fmtCrc } from "./use-income-planner"

type Breakdown = ReturnType<typeof computeCrSalary>

export function PeriodToggle({
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

export function CurrencyToggle({
  currency,
  onCurrencyChange,
}: {
  currency: "CRC" | "USD"
  onCurrencyChange: (currency: "CRC" | "USD") => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant={currency === "CRC" ? "secondary" : "outline"}
        onClick={() => onCurrencyChange("CRC")}
      >
        CRC
      </Button>
      <Button
        type="button"
        size="sm"
        variant={currency === "USD" ? "secondary" : "outline"}
        onClick={() => onCurrencyChange("USD")}
      >
        USD
      </Button>
    </div>
  )
}

export function VoluntaryDeductionsFields({
  solidaristaPct,
  onSolidaristaPctChange,
  pensionPct,
  onPensionPctChange,
  esppPct,
  onEsppPctChange,
}: {
  solidaristaPct: string
  onSolidaristaPctChange: (value: string) => void
  pensionPct: string
  onPensionPctChange: (value: string) => void
  esppPct: string
  onEsppPctChange: (value: string) => void
}) {
  return (
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
  )
}

export function SalaryBreakdownPanel({
  breakdown,
  voluntaryPct,
}: {
  breakdown: Breakdown
  voluntaryPct: {
    solidaristaPct: number
    pensionComplementariaPct: number
    esppPct: number
  }
}) {
  return (
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
  )
}

export function BreakdownRow({
  label,
  value,
  hint,
  strong,
}: {
  label: string
  value: string
  hint?: string
  strong?: boolean
}) {
  return (
    <div>
      <div className="flex justify-between gap-3">
        <span className={strong ? "text-foreground font-medium" : "text-muted-foreground"}>
          {label}
        </span>
        <span className={strong ? "text-foreground font-semibold" : ""}>{value}</span>
      </div>
      {hint ? <p className="text-muted-foreground mt-0.5 text-[11px]">{hint}</p> : null}
    </div>
  )
}
