import {
  activeBonusesForMonth,
  bonusGrossForMonth,
  type IncomeBonusLike,
  parseBonusMonths,
} from "./income-bonus"
import { roundMoney } from "./currency"
import { numFromDecimal } from "./decimal"
import {
  computeCrSalary,
  computeCrSalaryFromMonthlyGrossCrc,
  grossMonthlyCrcFromInput,
  type CrPayPeriod,
} from "./utils/taxCalculator"

export type IncomeProfileSettings = {
  crSalaryGross: unknown
  crSalaryCurrency: string
  crPayPeriod: string
  crCrcPerUsd: unknown
  crSolidaristaPct: unknown
  crPensionComplementariaPct: unknown
  crEsppPct: unknown
}

export type IncomeBonusRow = {
  name: string
  grossAmount: unknown
  grossCurrency: string
  months: string
}

export type IncomeProfileBreakdown = {
  grossMonthlyCrc: number
  netMonthlyCrc: number
  totalDeductionsCrc: number
  bonusGrossCrc: number
}

export type ExpectedIncomeForMonth = {
  expectedNetCrc: number
  calendarMonth: number
  bonusGrossCrc: number
  activeBonuses: { name: string; grossAmountCrc: number }[]
}

function parsePayPeriod(value: string): CrPayPeriod {
  return value === "BIWEEKLY" ? "BIWEEKLY" : "MONTHLY"
}

function parseSalaryCurrency(value: string): "CRC" | "USD" {
  return value === "USD" ? "USD" : "CRC"
}

function voluntaryPctFromSettings(settings: IncomeProfileSettings) {
  return {
    solidaristaPct: numFromDecimal(settings.crSolidaristaPct),
    pensionComplementariaPct: numFromDecimal(settings.crPensionComplementariaPct),
    esppPct: numFromDecimal(settings.crEsppPct),
  }
}

function baseSalaryGrossMonthlyCrc(
  settings: IncomeProfileSettings,
  salaryOverride?: {
    gross: number
    period: CrPayPeriod
    currency: "CRC" | "USD"
  },
): number {
  const gross = salaryOverride?.gross ?? numFromDecimal(settings.crSalaryGross)
  if (gross <= 0) return 0
  return grossMonthlyCrcFromInput(
    gross,
    salaryOverride?.period ?? parsePayPeriod(settings.crPayPeriod),
    salaryOverride?.currency ?? parseSalaryCurrency(settings.crSalaryCurrency),
    numFromDecimal(settings.crCrcPerUsd),
  )
}

function bonusesAsLike(rows: IncomeBonusRow[]): IncomeBonusLike[] {
  return rows.map((b) => ({
    name: b.name,
    grossAmount: numFromDecimal(b.grossAmount),
    grossCurrency: b.grossCurrency,
    months: parseBonusMonths(b.months),
  }))
}

/** Compute CRC breakdown for a calendar month (1–12), combining salary + bonus gross. */
export function computeIncomeProfileBreakdownForMonth(
  settings: IncomeProfileSettings,
  bonuses: IncomeBonusRow[],
  month: number,
  salaryOverride?: {
    gross: number
    period: CrPayPeriod
    currency: "CRC" | "USD"
  },
): IncomeProfileBreakdown | null {
  const baseGross = baseSalaryGrossMonthlyCrc(settings, salaryOverride)
  if (baseGross <= 0) return null

  const crcPerUsd = numFromDecimal(settings.crCrcPerUsd)
  const bonusList = bonusesAsLike(bonuses)
  const bonusGrossCrc = bonusGrossForMonth(bonusList, month, crcPerUsd)
  const totalGross = baseGross + bonusGrossCrc

  const breakdown = computeCrSalaryFromMonthlyGrossCrc(totalGross, {
    voluntaryPct: voluntaryPctFromSettings(settings),
  })

  return {
    grossMonthlyCrc: breakdown.grossMonthlyCrc,
    netMonthlyCrc: breakdown.netMonthlyCrc,
    totalDeductionsCrc: breakdown.grossMonthlyCrc - breakdown.netMonthlyCrc,
    bonusGrossCrc,
  }
}

/** Salary-only breakdown (no bonuses). */
export function computeIncomeProfileBreakdown(
  settings: IncomeProfileSettings,
): IncomeProfileBreakdown | null {
  const result = computeIncomeProfileBreakdownForMonth(settings, [], 1)
  if (!result) return null
  return { ...result, bonusGrossCrc: 0 }
}

export function computeExpectedNetForMonth(
  settings: IncomeProfileSettings,
  bonuses: IncomeBonusRow[],
  month: number,
  salaryOverride?: {
    gross: number
    period: CrPayPeriod
    currency: "CRC" | "USD"
  },
): ExpectedIncomeForMonth {
  const crcPerUsd = numFromDecimal(settings.crCrcPerUsd)
  const bonusList = bonusesAsLike(bonuses)
  const activeBonuses = activeBonusesForMonth(bonusList, month, crcPerUsd)
  const bonusGrossCrc = bonusGrossForMonth(bonusList, month, crcPerUsd)

  const profile = computeIncomeProfileBreakdownForMonth(settings, bonuses, month, salaryOverride)

  return {
    expectedNetCrc: profile ? roundMoney(profile.netMonthlyCrc) : 0,
    calendarMonth: month,
    bonusGrossCrc,
    activeBonuses,
  }
}

export function computeExpectedNetForCurrentMonth(
  settings: IncomeProfileSettings,
  bonuses: IncomeBonusRow[],
  salaryOverride?: {
    gross: number
    period: CrPayPeriod
    currency: "CRC" | "USD"
  },
): ExpectedIncomeForMonth {
  const month = new Date().getMonth() + 1
  return computeExpectedNetForMonth(settings, bonuses, month, salaryOverride)
}

/** Expected monthly net income in CRC (current calendar month, includes bonuses). */
export function computeExpectedMonthlyIncomeBase(
  settings: IncomeProfileSettings,
  bonuses: IncomeBonusRow[] = [],
): number {
  return computeExpectedNetForCurrentMonth(settings, bonuses).expectedNetCrc
}

/** Live salary calculator net with bonuses for current month. */
export function computeLiveExpectedNetForCurrentMonth(
  settings: IncomeProfileSettings,
  bonuses: IncomeBonusRow[],
  live: { gross: number; period: CrPayPeriod; currency: "CRC" | "USD" },
): number {
  return computeExpectedNetForCurrentMonth(settings, bonuses, live).expectedNetCrc
}

export { computeCrSalary }
