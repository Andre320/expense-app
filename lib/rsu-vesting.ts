import { roundMoney } from "./currency"

export type VestScheduleInput = {
  grantDate: Date
  totalShares: number
  vestingPeriodMonths: number
  vestIntervalMonths: number
  vestDayOfMonth: number
}

export type VestScheduleRow = {
  sequence: number
  scheduledDate: Date
  shares: number
}

export type TaxWithholdResult = {
  grossShares: number
  sharesWithheld: number
  netShares: number
}

export type VestReceiveSettlement = {
  grossShares: number
  sharesWithheld: number
  netSharesExact: number
  netWholeShares: number
  fractionalShares: number
  cashBonusUsd: number
}

export type VestSummaryInput = {
  sequence: number
  scheduledDate: Date
  shares: number
  status: "PENDING" | "RECEIVED"
  netShares?: number | null
  cashBonusUsd?: number | null
}

export type PlanSummaryInput = {
  totalShares: number
  ticker: string
}

export type StockQuoteInput = {
  priceUsd: number
  asOf: string
}

export type PlanSummary = {
  sharesReceived: number
  sharesRemaining: number
  pctComplete: number
  nextVestDate: string | null
  installmentsTotal: number
  installmentsReceived: number
}

export type PlanValuation = {
  receivedGrossUsd: number
  receivedNetUsd: number
  receivedCashBonusUsd: number
  pendingGrossUsd: number
  totalGrantGrossUsd: number
}

function roundShares(n: number): number {
  return Math.round(n * 100) / 100
}

/** Clamp vest day to valid day in month (e.g. day 31 → Feb 28). */
export function vestDateForMonth(year: number, monthIndex: number, day: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const d = Math.min(Math.max(1, day), lastDay)
  return new Date(year, monthIndex, d, 12, 0, 0, 0)
}

export function buildVestSchedule(input: VestScheduleInput): VestScheduleRow[] {
  const { grantDate, totalShares, vestingPeriodMonths, vestIntervalMonths, vestDayOfMonth } = input

  if (vestIntervalMonths <= 0 || vestingPeriodMonths <= 0) {
    throw new Error("Vesting period and interval must be positive")
  }
  if (vestingPeriodMonths % vestIntervalMonths !== 0) {
    throw new Error("Vesting period must be divisible by vest interval")
  }

  const installments = vestingPeriodMonths / vestIntervalMonths
  const basePerVest = roundShares(totalShares / installments)
  const rows: VestScheduleRow[] = []

  let allocated = 0
  const startYear = grantDate.getFullYear()
  const startMonth = grantDate.getMonth()

  for (let i = 0; i < installments; i++) {
    const monthOffset = (i + 1) * vestIntervalMonths
    const targetMonth = startMonth + monthOffset
    const scheduledDate = vestDateForMonth(
      startYear + Math.floor(targetMonth / 12),
      ((targetMonth % 12) + 12) % 12,
      vestDayOfMonth,
    )

    const isLast = i === installments - 1
    const shares = isLast ? roundShares(totalShares - allocated) : basePerVest
    allocated = roundShares(allocated + shares)

    rows.push({
      sequence: i + 1,
      scheduledDate,
      shares,
    })
  }

  return rows
}

export function applyTaxWithhold(shares: number, taxWithholdPct: number): TaxWithholdResult {
  const pct = Math.min(100, Math.max(0, taxWithholdPct))
  const grossShares = roundShares(shares)
  const sharesWithheld = roundShares((grossShares * pct) / 100)
  const netShares = roundShares(grossShares - sharesWithheld)
  return { grossShares, sharesWithheld, netShares }
}

/** Whole shares only; fractional remainder is paid as cash at vest price. */
export function settleVestReceive(
  grossShares: number,
  taxWithholdPct: number,
  priceUsd: number,
): VestReceiveSettlement {
  const tax = applyTaxWithhold(grossShares, taxWithholdPct)
  const netWholeShares = Math.floor(tax.netShares)
  const fractionalShares = roundShares(tax.netShares - netWholeShares)
  return {
    grossShares: tax.grossShares,
    sharesWithheld: tax.sharesWithheld,
    netSharesExact: tax.netShares,
    netWholeShares,
    fractionalShares,
    cashBonusUsd: roundMoney(fractionalShares * priceUsd),
  }
}

export function summarizePlan(plan: PlanSummaryInput, vests: VestSummaryInput[]): PlanSummary {
  const totalShares = roundShares(plan.totalShares)
  // Next pending vest: earliest PENDING by sequence
  const pending = vests
    .filter((v) => v.status === "PENDING")
    .sort((a, b) => a.sequence - b.sequence)
  const nextPending = pending[0]
  const nextDate = nextPending?.scheduledDate ?? null

  let grossReceived = 0
  let installmentsReceived = 0
  for (const v of vests) {
    if (v.status === "RECEIVED") {
      grossReceived = roundShares(grossReceived + v.shares)
      installmentsReceived += 1
    }
  }

  const sharesRemaining = roundShares(Math.max(0, totalShares - grossReceived))
  const pctComplete =
    totalShares > 0 ? Math.min(100, roundMoney((grossReceived / totalShares) * 100)) : 0

  return {
    sharesReceived: grossReceived,
    sharesRemaining,
    pctComplete,
    nextVestDate: nextDate ? nextDate.toISOString() : null,
    installmentsTotal: vests.length,
    installmentsReceived: installmentsReceived,
  }
}

export function valuePlan(
  plan: PlanSummaryInput,
  vests: VestSummaryInput[],
  quote: StockQuoteInput | null,
  taxWithholdPct: number,
): PlanValuation | null {
  if (!quote || quote.priceUsd <= 0) return null

  const price = quote.priceUsd
  let receivedGrossUsd = 0
  let receivedNetUsd = 0
  let receivedCashBonusUsd = 0
  let pendingGrossUsd = 0

  for (const v of vests) {
    if (v.status === "RECEIVED") {
      receivedGrossUsd += v.shares * price
      const net = v.netShares ?? applyTaxWithhold(v.shares, taxWithholdPct).netShares
      receivedNetUsd += net * price
      receivedCashBonusUsd += v.cashBonusUsd ?? 0
    } else {
      pendingGrossUsd += v.shares * price
    }
  }

  receivedNetUsd += receivedCashBonusUsd

  return {
    receivedGrossUsd: roundMoney(receivedGrossUsd),
    receivedNetUsd: roundMoney(receivedNetUsd),
    receivedCashBonusUsd: roundMoney(receivedCashBonusUsd),
    pendingGrossUsd: roundMoney(pendingGrossUsd),
    totalGrantGrossUsd: roundMoney(plan.totalShares * price),
  }
}
