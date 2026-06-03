/** Calendar month key yyyy-MM for bonus scheduling. */
export type CalendarMonthKey = `${number}-${string}`

export type IncomeBonusLike = {
  name: string
  grossAmount: number
  grossCurrency: string
  /** ISO date YYYY-MM-DD */
  paidOn: string
  repeatsAnnually: boolean
}

/** Convert bonus gross to monthly CRC for tax combination. */
export function bonusGrossToMonthlyCrc(
  bonus: Pick<IncomeBonusLike, "grossAmount" | "grossCurrency">,
  crcPerUsd: number,
): number {
  if (bonus.grossCurrency === "USD") {
    return Math.max(0, bonus.grossAmount * Math.max(crcPerUsd, 1e-9))
  }
  return Math.max(0, bonus.grossAmount)
}

export function bonusPaidCalendarMonth(paidOn: string): string {
  return paidOn.slice(0, 7)
}

export function bonusAppliesInCalendarMonth(bonus: IncomeBonusLike, yyyyMm: string): boolean {
  const paidYm = bonusPaidCalendarMonth(bonus.paidOn)
  if (bonus.repeatsAnnually) {
    return paidYm.slice(5, 7) === yyyyMm.slice(5, 7)
  }
  return paidYm === yyyyMm
}

/** Sum bonus gross in CRC for a calendar month (yyyy-MM). */
export function bonusGrossForCalendarMonth(
  bonuses: IncomeBonusLike[],
  yyyyMm: string,
  crcPerUsd: number,
): number {
  let total = 0
  for (const b of bonuses) {
    if (!bonusAppliesInCalendarMonth(b, yyyyMm)) continue
    total += bonusGrossToMonthlyCrc(b, crcPerUsd)
  }
  return total
}

export function activeBonusesForCalendarMonth(
  bonuses: IncomeBonusLike[],
  yyyyMm: string,
  crcPerUsd: number,
): { name: string; grossAmountCrc: number }[] {
  return bonuses
    .filter((b) => bonusAppliesInCalendarMonth(b, yyyyMm))
    .map((b) => ({
      name: b.name,
      grossAmountCrc: bonusGrossToMonthlyCrc(b, crcPerUsd),
    }))
}
