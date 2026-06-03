"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"
import { fetchJson, parseApiError } from "@/lib/shared/api-error"
import type { IncomeBonusDto } from "@/components/features/income/income-bonuses-manager"
import { computeLiveExpectedNetForCurrentMonth } from "@/lib/income/profile"
import {
  computeCrSalary,
  grossMonthlyCrcFromInput,
  type CrPayPeriod,
} from "@/lib/income/tax-calculator"

export type Settings = {
  crSalaryGross: number
  crSalaryCurrency: string
  crPayPeriod: string
  crCrcPerUsd: number
  crSolidaristaPct: number
  crPensionComplementariaPct: number
  crEsppPct: number
}

export async function fetchSettings(): Promise<Settings> {
  return fetchJson("/api/settings")
}

export function useSettingsQuery() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  })
}

export function fmtCrc(n: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(n)
}

export function useIncomePlannerForm({
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
        paidOn: b.paidOn,
        repeatsAnnually: b.repeatsAnnually,
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
      if (!res.ok) throw await parseApiError(res)
      return res.json()
    },
    onSuccess: () => {
      toast.success("Saved salary profile")
      qc.invalidateQueries({ queryKey: ["settings"] })
      qc.invalidateQueries({ queryKey: ["income-profiles"] })
      qc.invalidateQueries({ queryKey: ["analytics", "summary"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const grossMonthlyCrc =
    breakdown?.grossMonthlyCrc ?? grossMonthlyCrcFromInput(grossNum, period, inputCurrency, crcUsd)

  return {
    grossStr,
    setGrossStr,
    period,
    setPeriod,
    inputCurrency,
    setInputCurrency,
    solidaristaPct,
    setSolidaristaPct,
    pensionPct,
    setPensionPct,
    esppPct,
    setEsppPct,
    grossNum,
    crcUsd,
    voluntaryPct,
    breakdown,
    pieData,
    saveMut,
    grossMonthlyCrc,
  }
}
