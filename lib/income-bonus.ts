/** Parse stored JSON month list (1–12). Invalid input returns []. */
export function parseBonusMonths(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((m): m is number => typeof m === "number" && m >= 1 && m <= 12)
      .sort((a, b) => a - b)
  } catch {
    return []
  }
}

export function stringifyBonusMonths(months: number[]): string {
  const unique = [...new Set(months.filter((m) => m >= 1 && m <= 12))].sort((a, b) => a - b)
  return JSON.stringify(unique)
}

export type IncomeBonusLike = {
  name: string
  grossAmount: number
  grossCurrency: string
  months: number[]
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

export function bonusAppliesInMonth(bonus: IncomeBonusLike, month: number): boolean {
  return bonus.months.includes(month)
}

/** Sum bonus gross in CRC for a calendar month (1–12). */
export function bonusGrossForMonth(
  bonuses: IncomeBonusLike[],
  month: number,
  crcPerUsd: number,
): number {
  let total = 0
  for (const b of bonuses) {
    if (!bonusAppliesInMonth(b, month)) continue
    total += bonusGrossToMonthlyCrc(b, crcPerUsd)
  }
  return total
}

export function activeBonusesForMonth(
  bonuses: IncomeBonusLike[],
  month: number,
  crcPerUsd: number,
): { name: string; grossAmountCrc: number }[] {
  return bonuses
    .filter((b) => bonusAppliesInMonth(b, month))
    .map((b) => ({
      name: b.name,
      grossAmountCrc: bonusGrossToMonthlyCrc(b, crcPerUsd),
    }))
}
