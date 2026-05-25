import { describe, expect, it } from "vitest"
import {
  savingsAccountCreateZ,
  savingsCreateZ,
  savingsMovementCreateZ,
} from "@/lib/shared/validators/savings"

describe("savingsCreateZ", () => {
  it("accepts minimal goal", () => {
    expect(savingsCreateZ.safeParse({ name: "Emergency" }).success).toBe(true)
  })

  it("rejects negative target", () => {
    expect(savingsCreateZ.safeParse({ name: "X", targetAmount: -1 }).success).toBe(false)
  })
})

describe("savingsMovementCreateZ", () => {
  it("accepts deposit", () => {
    expect(savingsMovementCreateZ.safeParse({ kind: "DEPOSIT", amount: 100 }).success).toBe(true)
  })

  it("rejects non-positive amount", () => {
    expect(savingsMovementCreateZ.safeParse({ kind: "DEPOSIT", amount: 0 }).success).toBe(false)
  })
})

describe("savingsAccountCreateZ", () => {
  it("accepts account with optional balance", () => {
    expect(savingsAccountCreateZ.safeParse({ name: "Checking", balance: 0 }).success).toBe(true)
  })
})
