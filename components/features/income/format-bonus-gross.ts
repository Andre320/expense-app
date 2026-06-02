import { bonusGrossToMonthlyCrc } from "@/lib/income/bonus"
import type { IncomeBonusDto } from "@/components/features/income/income-bonus-types"

export function formatGross(b: IncomeBonusDto, crcPerUsd: number) {
  if (b.grossCurrency === "USD") {
    const crc = bonusGrossToMonthlyCrc(b, crcPerUsd)
    return `$${b.grossAmount.toLocaleString()} (≈ ₡${Math.round(crc).toLocaleString()})`
  }
  return `₡${b.grossAmount.toLocaleString()}`
}
