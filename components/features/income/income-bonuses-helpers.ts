import type { IncomeBonusDto } from "@/components/features/income/income-bonus-types"

export const INCOME_BONUSES_QUERY_KEY = ["income-bonuses"] as const

export function sortIncomeBonuses(data: IncomeBonusDto[] | undefined): IncomeBonusDto[] {
  return [...(data ?? [])].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
}
