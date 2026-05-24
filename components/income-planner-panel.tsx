"use client"

import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { PageIntro } from "@/components/patterns/page-intro"
import { InsetPanel } from "@/components/patterns/inset-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { rechartsTooltipContentStyle } from "@/lib/chart-style"
import {
  computeCrSalary,
  CR_CCSS_EMPLOYEE_RATE_2026,
  grossMonthlyCrcFromInput,
  type CrPayPeriod,
} from "@/lib/utils/taxCalculator"
import { computeLiveExpectedNetForCurrentMonth } from "@/lib/income-profile"
import { stringifyBonusMonths } from "@/lib/income-bonus"
import type { IncomeBonusDto } from "@/components/income-bonuses-manager"

type Settings = {
  crSalaryGross: number
  crSalaryCurrency: string
  crPayPeriod: string
  crCrcPerUsd: number
  crSolidaristaPct: number
  crPensionComplementariaPct: number
  crEsppPct: number
}

async function fetchSettings(): Promise<Settings> {
  const res = await fetch("/api/settings")
  if (!res.ok) throw new Error("settings")
  return res.json()
}

const PIE_COLORS: Record<string, string> = {
  net: "var(--chart-income)",
  ccss: "#a78bfa",
  renta: "#f97316",
  solidarista: "#38bdf8",
  pension: "#c084fc",
  espp: "#94a3b8",
}

const PIE_LEGEND_DOT_CLASS: Record<string, string> = {
  net: "bg-[color:var(--chart-income)]",
  ccss: "bg-[#a78bfa]",
  renta: "bg-[#f97316]",
  solidarista: "bg-[#38bdf8]",
  pension: "bg-[#c084fc]",
  espp: "bg-[#94a3b8]",
}

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
  const {
    data: settings,
    dataUpdatedAt,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  })

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
        <p className="text-sm text-red-400">
          Could not load saved profile. Check that the database is migrated and restart the dev
          server after schema changes.
        </p>
      ) : settings ? (
        <IncomePlannerForm
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

function IncomePlannerForm({
  settings,
  bonuses,
  onLiveExpectedIncomeBase,
}: {
  settings: Settings
  bonuses: IncomeBonusDto[]
  onLiveExpectedIncomeBase?: (amountBase: number) => void
}) {
  const qc = useQueryClient()
  const [grossStr, setGrossStr] = React.useState(() =>
    settings.crSalaryGross > 0 ? String(settings.crSalaryGross) : "850000",
  )
  const [period, setPeriod] = React.useState<CrPayPeriod>(() =>
    settings.crPayPeriod === "BIWEEKLY" ? "BIWEEKLY" : "MONTHLY",
  )
  const [inputCurrency, setInputCurrency] = React.useState<"CRC" | "USD">(() =>
    settings.crSalaryCurrency === "USD" ? "USD" : "CRC",
  )
  const [solidaristaPct, setSolidaristaPct] = React.useState(() =>
    String(settings.crSolidaristaPct),
  )
  const [pensionPct, setPensionPct] = React.useState(() =>
    String(settings.crPensionComplementariaPct),
  )
  const [esppPct, setEsppPct] = React.useState(() => String(settings.crEsppPct))

  const grossNum = Number.parseFloat(grossStr.replace(/,/g, "")) || 0
  const crcUsd = settings?.crCrcPerUsd ?? 505

  const voluntaryPct = React.useMemo(
    () => ({
      solidaristaPct: Number.parseFloat(solidaristaPct) || 0,
      pensionComplementariaPct: Number.parseFloat(pensionPct) || 0,
      esppPct: Number.parseFloat(esppPct) || 0,
    }),
    [solidaristaPct, pensionPct, esppPct],
  )

  const breakdown = React.useMemo(() => {
    return computeCrSalary(grossNum, period, inputCurrency, crcUsd, voluntaryPct)
  }, [grossNum, period, inputCurrency, crcUsd, voluntaryPct])

  const bonusRows = React.useMemo(
    () =>
      bonuses.map((b) => ({
        name: b.name,
        grossAmount: b.grossAmount,
        grossCurrency: b.grossCurrency,
        months: stringifyBonusMonths(b.months),
      })),
    [bonuses],
  )

  React.useEffect(() => {
    if (!onLiveExpectedIncomeBase || !settings || grossNum <= 0) return
    const net = computeLiveExpectedNetForCurrentMonth(
      {
        ...settings,
        crSolidaristaPct: voluntaryPct.solidaristaPct,
        crPensionComplementariaPct: voluntaryPct.pensionComplementariaPct,
        crEsppPct: voluntaryPct.esppPct,
      },
      bonusRows,
      { gross: grossNum, period, currency: inputCurrency },
    )
    onLiveExpectedIncomeBase(net)
  }, [onLiveExpectedIncomeBase, settings, grossNum, period, inputCurrency, voluntaryPct, bonusRows])

  const pieData = React.useMemo(() => {
    if (!breakdown) return []
    const rows: { name: string; value: number; key: string }[] = [
      { name: "Take-home", value: Math.max(0, breakdown.netMonthlyCrc), key: "net" },
      { name: "CCSS", value: Math.max(0, breakdown.ccssMonthlyCrc), key: "ccss" },
      { name: "Income tax", value: Math.max(0, breakdown.rentaMonthlyCrc), key: "renta" },
      {
        name: "Solidarista",
        value: Math.max(0, breakdown.solidaristaMonthlyCrc),
        key: "solidarista",
      },
      {
        name: "Pensión compl.",
        value: Math.max(0, breakdown.pensionComplementariaMonthlyCrc),
        key: "pension",
      },
      { name: "ESPP / otro %", value: Math.max(0, breakdown.esppMonthlyCrc), key: "espp" },
    ]
    return rows.filter((r) => r.value > 0 || r.key === "net")
  }, [breakdown])

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!settings || !breakdown) throw new Error("No settings")
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crSalaryGross: grossNum,
          crSalaryCurrency: inputCurrency,
          crPayPeriod: period,
          crSolidaristaPct: voluntaryPct.solidaristaPct,
          crPensionComplementariaPct: voluntaryPct.pensionComplementariaPct,
          crEsppPct: voluntaryPct.esppPct,
        }),
      })
      if (!res.ok) throw new Error("Save failed")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Saved salary profile")
      qc.invalidateQueries({ queryKey: ["settings"] })
      qc.invalidateQueries({ queryKey: ["analytics", "summary"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function fmtCrc(n: number) {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      maximumFractionDigits: 0,
    }).format(n)
  }

  const grossMonthlyCrc =
    breakdown?.grossMonthlyCrc ?? grossMonthlyCrcFromInput(grossNum, period, inputCurrency, crcUsd)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
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
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={period === "MONTHLY" ? "default" : "outline"}
              onClick={() => setPeriod("MONTHLY")}
            >
              Monthly
            </Button>
            <Button
              type="button"
              size="sm"
              variant={period === "BIWEEKLY" ? "default" : "outline"}
              onClick={() => setPeriod("BIWEEKLY")}
            >
              Bi-weekly (quincenal)
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={inputCurrency === "CRC" ? "secondary" : "outline"}
              onClick={() => setInputCurrency("CRC")}
            >
              CRC
            </Button>
            <Button
              type="button"
              size="sm"
              variant={inputCurrency === "USD" ? "secondary" : "outline"}
              onClick={() => setInputCurrency("USD")}
            >
              USD
            </Button>
          </div>

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
                  onChange={(e) => setSolidaristaPct(e.target.value)}
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
                  onChange={(e) => setPensionPct(e.target.value)}
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
                  onChange={(e) => setEsppPct(e.target.value)}
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
              onChange={(e) => setGrossStr(e.target.value)}
              placeholder={inputCurrency === "CRC" ? "850000" : "1700"}
            />
          </div>

          <InsetPanel className="p-4 text-sm">
            <div className="grid gap-2 tabular-nums">
              <Row label="Gross (monthly, CRC)" value={fmtCrc(breakdown.grossMonthlyCrc)} />
              <Row label="CCSS (monthly)" value={fmtCrc(breakdown.ccssMonthlyCrc)} />
              <Row label="Income tax (monthly)" value={fmtCrc(breakdown.rentaMonthlyCrc)} />
              <Row
                label="Asoc. solidarista"
                value={fmtCrc(breakdown.solidaristaMonthlyCrc)}
                hint={`${voluntaryPct.solidaristaPct}% of gross`}
              />
              <Row
                label="Pensión complementaria"
                value={fmtCrc(breakdown.pensionComplementariaMonthlyCrc)}
                hint={`${voluntaryPct.pensionComplementariaPct}% of gross`}
              />
              <Row
                label="ESPP / otro %"
                value={fmtCrc(breakdown.esppMonthlyCrc)}
                hint={`${voluntaryPct.esppPct}% of gross`}
              />
              <Row label="Net (monthly)" value={fmtCrc(breakdown.netMonthlyCrc)} strong />
              <Row label="Net (per quincena)" value={fmtCrc(breakdown.netBiweeklyCrc)} />
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

      <Card>
        <CardHeader>
          <CardTitle>Where the money goes</CardTitle>
          <CardDescription>
            Monthly view in CRC — gross {fmtCrc(grossMonthlyCrc)} before deductions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mx-auto h-[280px] w-full max-w-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={PIE_COLORS[entry.key] ?? "#71717a"}
                      stroke="var(--card)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => fmtCrc(typeof v === "number" ? v : Number(v))}
                  contentStyle={rechartsTooltipContentStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="text-muted-foreground mt-4 space-y-2 text-xs">
            {pieData.map((p) => (
              <li key={p.key} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${PIE_LEGEND_DOT_CLASS[p.key] ?? "bg-[#71717a]"}`}
                  />
                  {p.name}
                </span>
                <span className="text-foreground tabular-nums">{fmtCrc(p.value)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({
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
