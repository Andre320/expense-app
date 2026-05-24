/** Format an amount in ISO currency (base / reporting). */
export function formatMoneyBase(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
