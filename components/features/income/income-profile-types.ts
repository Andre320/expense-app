export type IncomeProfileDto = {
  id: string
  label: string
  effectiveFrom: string
  effectiveTo: string | null
  crSalaryGross: number
  crSalaryCurrency: string
  crPayPeriod: string
  crSolidaristaPct: number
  crPensionComplementariaPct: number
  crEsppPct: number
  position: number
}

export const INCOME_PROFILES_QUERY_KEY = ["income-profiles"] as const
