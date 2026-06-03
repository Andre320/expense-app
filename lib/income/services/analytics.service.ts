import "server-only"

import { subMonths, startOfMonth, format } from "date-fns"
import type { PrismaClient } from "@/app/generated/prisma/client"
import { REPORTING_CURRENCY } from "@/lib/shared/app-currency"
import { roundMoney, amountToReportingBase } from "@/lib/shared/currency"
import {
  profileToSettingsWithDeductions,
  pickDeductionFallback,
} from "@/lib/income/income-profile-deductions"
import {
  getProfileForMonth,
  hasSalaryProfile,
  plannedNetForCalendarMonth,
} from "@/lib/income/income-profile-period"
import { computeExpectedNetForCurrentMonth } from "@/lib/income/profile"
import type { IncomeBonusRow } from "@/lib/income/profile"
import {
  ensureIncomeProfilesFromSettings,
  listIncomeProfileRows,
} from "@/lib/income/services/income-profile.service"
import { repairProfileVoluntaryDeductions } from "@/lib/income/services/income-profile-sync"
import { numFromDecimal } from "@/lib/shared/utils"

export type ActiveBonusSummary = {
  name: string
  grossAmountCrc: number
}

export type MonthlyAnalyticsPoint = {
  month: string
  /** Ledger INCOME transactions in reporting currency */
  incomeLedger: number
  /** Planned net salary from active income profile for that month */
  plannedIncome: number
  expense: number
}

export type AnalyticsSummaryPayload = {
  monthly: MonthlyAnalyticsPoint[]
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

function bonusRowsFromDb(
  bonuses: {
    name: string
    grossAmount: unknown
    grossCurrency: string
    paidOn: Date
    repeatsAnnually: boolean
  }[],
): IncomeBonusRow[] {
  return bonuses.map((b) => ({
    name: b.name,
    grossAmount: b.grossAmount,
    grossCurrency: b.grossCurrency,
    paidOn: b.paidOn.toISOString().slice(0, 10),
    repeatsAnnually: b.repeatsAnnually,
  }))
}

export async function getAnalyticsSummary(
  prisma: PrismaClient,
  userId: string,
): Promise<AnalyticsSummaryPayload> {
  await ensureIncomeProfilesFromSettings(prisma, userId)
  await repairProfileVoluntaryDeductions(prisma, userId)

  const settings = await prisma.appSettings.findUniqueOrThrow({
    where: { userId },
  })

  const bonuses = await prisma.incomeBonus.findMany({
    where: { userId },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  })
  const bonusRows = bonusRowsFromDb(bonuses)

  const profiles = await listIncomeProfileRows(prisma, userId)

  const since = startOfMonth(subMonths(new Date(), 11))
  const txs = await prisma.transaction.findMany({
    where: { userId, occurredAt: { gte: since } },
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

  const buckets = new Map<string, { incomeLedger: number; expense: number }>()
  for (const k of monthKeys) {
    buckets.set(k, { incomeLedger: 0, expense: 0 })
  }

  for (const t of txs) {
    const key = format(t.occurredAt, "yyyy-MM")
    if (!buckets.has(key)) continue
    const b = buckets.get(key)!
    const amt = numFromDecimal(t.amountBase)
    if (t.kind === "INCOME") b.incomeLedger += amt
    else b.expense += amt
  }

  const monthly = monthKeys.map((month) => {
    const bucket = buckets.get(month)!
    const profile = getProfileForMonth(profiles, month)
    const plannedIncome = plannedNetForCalendarMonth(
      profile,
      settings.crCrcPerUsd,
      bonusRows,
      month,
      profiles,
      settings,
    )
    return {
      month,
      incomeLedger: bucket.incomeLedger,
      plannedIncome,
      expense: bucket.expense,
    }
  })

  const last3 = monthly.slice(-3)
  const burnRate = last3.length > 0 ? last3.reduce((s, m) => s + m.expense, 0) / last3.length : 0

  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
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
    where: { userId },
    select: { balance: true, currency: true },
  })
  const savingsAccountsTotal = roundMoney(
    accounts.reduce(
      (s, a) => s + amountToReportingBase(numFromDecimal(a.balance), a.currency, crcPerUsd),
      0,
    ),
  )

  const allTxs = await prisma.transaction.findMany({
    where: { userId },
    select: { kind: true, amountBase: true },
  })
  let ledgerNetBalance = 0
  for (const t of allTxs) {
    const amt = numFromDecimal(t.amountBase)
    if (t.kind === "INCOME") ledgerNetBalance += amt
    else ledgerNetBalance -= amt
  }

  const currentMonthKey = format(new Date(), "yyyy-MM")
  const currentProfile = getProfileForMonth(profiles, currentMonthKey)
  const deductionFallback = pickDeductionFallback(profiles, settings)
  const settingsForForecast = currentProfile
    ? profileToSettingsWithDeductions(currentProfile, settings.crCrcPerUsd, deductionFallback)
    : settings

  const incomeForecast = computeExpectedNetForCurrentMonth(settingsForForecast, bonusRows)

  return {
    monthly,
    burnRate3Mo: Math.round(burnRate * 100) / 100,
    savingsTotal,
    savingsAccountsTotal,
    expectedMonthlyIncomeBase: incomeForecast.expectedNetCrc,
    ledgerNetBalance: roundMoney(ledgerNetBalance),
    hasSalaryProfile: hasSalaryProfile(profiles),
    reportingCurrency: REPORTING_CURRENCY,
    forecastCalendarMonth: incomeForecast.calendarMonth,
    bonusGrossThisMonth: incomeForecast.bonusGrossCrc,
    activeBonusesThisMonth: incomeForecast.activeBonuses,
    settings: {
      crCrcPerUsd: numFromDecimal(settings.crCrcPerUsd),
    },
  }
}
