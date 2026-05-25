import { roundMoney } from "@/lib/shared/currency"

export type SavingsMovementKind = "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT" | "INITIAL"

/** Apply a movement to a balance. For ADJUSTMENT, `amount` is the new absolute balance. */
export function applyMovementToBalance(
  currentBalance: number,
  kind: SavingsMovementKind,
  amount: number,
): number {
  if (amount < 0) throw new Error("Amount must be non-negative")
  switch (kind) {
    case "DEPOSIT":
    case "INITIAL":
      return roundMoney(currentBalance + amount)
    case "WITHDRAWAL": {
      const next = roundMoney(currentBalance - amount)
      if (next < 0) throw new Error("Insufficient balance")
      return next
    }
    case "ADJUSTMENT":
      return roundMoney(amount)
    default:
      throw new Error("Unknown movement kind")
  }
}

export function movementDelta(
  currentBalance: number,
  kind: SavingsMovementKind,
  amount: number,
): number {
  const next = applyMovementToBalance(currentBalance, kind, amount)
  return roundMoney(next - currentBalance)
}

export function movementKindLabel(kind: SavingsMovementKind): string {
  switch (kind) {
    case "DEPOSIT":
      return "Deposit"
    case "WITHDRAWAL":
      return "Withdrawal"
    case "ADJUSTMENT":
      return "Adjustment"
    case "INITIAL":
      return "Opening balance"
  }
}
