import "server-only"

import { subMonths, startOfMonth, format } from "date-fns"
import type { PrismaClient } from "@/app/generated/prisma/client"
import { REPORTING_CURRENCY } from "@/lib/app-currency"
import { roundMoney, amountToReportingBase } from "@/lib/currency"
import { computeExpectedNetForCurrentMonth } from "@/lib/income-profile"
import { numFromDecimal } from "@/lib/utils"

export type ActiveBonusSummary = {
  name: string
  grossAmountCrc: number
}

export type AnalyticsSummaryPayload = {
  monthly: { month: string; income: number; expense: number }[]
  burnRate3Mo: number
  savingsTotal: number
  savingsAccountsTotal: number
  expectedMonthlyIncomeBase: number
  ledgerNetBalance: number
  hasSalaryProfile: boolean
  reportingCurrency: typeof REPORTING_CURRENCY
  forecastCalendarMonth: number
  bonusGrossThisMonth: number
  activeBonusesThisMonth: ActiveBonusSummary[]
  settings: {
    crCrcPerUsd: number
  }
}

export async function getAnalyticsSummary(prisma: PrismaClient): Promise<AnalyticsSummaryPayload> {
  const settings = await prisma.appSettings.findUniqueOrThrow({
    where: { id: "default" },
  })

  const bonuses = await prisma.incomeBonus.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
  })

  const since = startOfMonth(subMonths(new Date(), 11))
  const txs = await prisma.transaction.findMany({
    where: { occurredAt: { gte: since } },
    select: {
      occurredAt: true,
      kind: true,
      amountBase: true,
    },
  })

  const monthKeys: string[] = []
  for (let i = 11; i >= 0; i--) {
    monthKeys.push(format(startOfMonth(subMonths(new Date(), i)), "yyyy-MM"))
  }

  const buckets = new Map<string, { income: number; expense: number }>()
  for (const k of monthKeys) {
    buckets.set(k, { income: 0, expense: 0 })
  }

  for (const t of txs) {
    const key = format(t.occurredAt, "yyyy-MM")
    if (!buckets.has(key)) continue
    const b = buckets.get(key)!
    const amt = numFromDecimal(t.amountBase)
    if (t.kind === "INCOME") b.income += amt
    else b.expense += amt
  }

  const monthly = monthKeys.map((month) => ({
    month,
    ...buckets.get(month)!,
  }))

  const last3 = monthly.slice(-3)
  const burnRate = last3.length > 0 ? last3.reduce((s, m) => s + m.expense, 0) / last3.length : 0

  const goals = await prisma.savingsGoal.findMany({
    select: { currentAmount: true, currency: true },
  })
  const crcPerUsd = numFromDecimal(settings.crCrcPerUsd)
  const savingsTotal = roundMoney(
    goals.reduce(
      (s, g) => s + amountToReportingBase(numFromDecimal(g.currentAmount), g.currency, crcPerUsd),
      0,
    ),
  )

  const accounts = await prisma.savingsAccount.findMany({
    select: { balance: true, currency: true },
  })
  const savingsAccountsTotal = roundMoney(
    accounts.reduce(
      (s, a) => s + amountToReportingBase(numFromDecimal(a.balance), a.currency, crcPerUsd),
      0,
    ),
  )

  const allTxs = await prisma.transaction.findMany({
    select: { kind: true, amountBase: true },
  })
  let ledgerNetBalance = 0
  for (const t of allTxs) {
    const amt = numFromDecimal(t.amountBase)
    if (t.kind === "INCOME") ledgerNetBalance += amt
    else ledgerNetBalance -= amt
  }

  const gross = numFromDecimal(settings.crSalaryGross)
  const incomeForecast = computeExpectedNetForCurrentMonth(settings, bonuses)

  return {
    monthly,
    burnRate3Mo: Math.round(burnRate * 100) / 100,
    savingsTotal,
    savingsAccountsTotal,
    expectedMonthlyIncomeBase: incomeForecast.expectedNetCrc,
    ledgerNetBalance: roundMoney(ledgerNetBalance),
    hasSalaryProfile: gross > 0,
    reportingCurrency: REPORTING_CURRENCY,
    forecastCalendarMonth: incomeForecast.calendarMonth,
    bonusGrossThisMonth: incomeForecast.bonusGrossCrc,
    activeBonusesThisMonth: incomeForecast.activeBonuses,
    settings: {
      crCrcPerUsd: numFromDecimal(settings.crCrcPerUsd),
    },
  }
}
