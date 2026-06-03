export type IncomeBonusDto = {
  id: string
  name: string
  grossAmount: number
  grossCurrency: string
  paidOn: string
  repeatsAnnually: boolean
  position: number
}

/** Month short labels for forecast sidebar (calendar month 1–12). */
export const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const

export const CURRENCY_OPTIONS = [
  { value: "CRC", label: "CRC" },
  { value: "USD", label: "USD" },
] as const
