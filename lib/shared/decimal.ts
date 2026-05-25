/** Parse Prisma Decimal / string / number to JS number. */
export function numFromDecimal(v: unknown): number {
  if (v == null) return 0
  if (typeof v === "number") return v
  if (typeof v === "string") return Number(v)
  if (typeof v === "object" && v !== null && "toString" in v) {
    return Number(String(v))
  }
  return Number(v)
}
