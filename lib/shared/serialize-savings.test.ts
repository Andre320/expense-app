import { describe, expect, it } from "vitest"
import {
  serializeIncomeBonus,
  serializeSavings,
  serializeSavingsAccount,
  serializeSavingsAccountMovement,
  serializeSavingsGoalMovement,
} from "@/lib/shared/serialize"

const now = new Date("2026-05-01T12:00:00.000Z")

describe("serializeSavings", () => {
  it("defaults currency and handles null target", () => {
    const result = serializeSavings({
      id: "g1",
      userId: "u1",
      name: "Emergency",
      currency: "",
      targetAmount: null,
      currentAmount: "100000",
      color: "#fff",
      notes: null,
      priorityOrder: 1,
      createdAt: now,
      updatedAt: now,
    })
    expect(result.currency).toBe("CRC")
    expect(result.targetAmount).toBeNull()
    expect(result.currentAmount).toBe(100000)
  })

  it("serializes goal with nullable target", () => {
    const result = serializeSavings({
      id: "g1",
      userId: "u1",
      name: "Vacation",
      currency: "CRC",
      targetAmount: null,
      currentAmount: "100000",
      color: null,
      notes: null,
      priorityOrder: 1,
      createdAt: now,
      updatedAt: now,
    })
    expect(result.currency).toBe("CRC")
    expect(result.targetAmount).toBeNull()
    expect(result.currentAmount).toBe(100000)
  })
})

describe("serializeIncomeBonus", () => {
  it("parses bonus months JSON", () => {
    const result = serializeIncomeBonus({
      id: "b1",
      userId: "u1",
      name: "Annual",
      grossAmount: "500000",
      grossCurrency: "CRC",
      months: "[3,12]",
      position: 1,
      createdAt: now,
      updatedAt: now,
    })
    expect(result.months).toEqual([3, 12])
    expect(result.grossAmount).toBe(500000)
  })
})

describe("serializeSavingsAccount", () => {
  it("serializes balance and currency", () => {
    const result = serializeSavingsAccount({
      id: "a1",
      userId: "u1",
      name: "Checking",
      currency: "USD",
      balance: "1500.50",
      notes: null,
      position: 0,
      createdAt: now,
      updatedAt: now,
    })
    expect(result.balance).toBe(1500.5)
    expect(result.currency).toBe("USD")
  })

  it("defaults empty currency to CRC", () => {
    const result = serializeSavingsAccount({
      id: "a1",
      userId: "u1",
      name: "Cash",
      currency: "",
      balance: "0",
      notes: null,
      position: 0,
      createdAt: now,
      updatedAt: now,
    })
    expect(result.currency).toBe("CRC")
  })
})

describe("serializeSavingsAccountMovement", () => {
  it("serializes movement fields", () => {
    const result = serializeSavingsAccountMovement({
      id: "m1",
      accountId: "a1",
      kind: "DEPOSIT",
      amount: "200",
      description: "Paycheck",
      occurredAt: now,
      createdAt: now,
    })
    expect(result.amount).toBe(200)
    expect(result.occurredAt).toBe(now.toISOString())
  })
})

describe("serializeSavingsGoalMovement", () => {
  it("serializes goal movement fields", () => {
    const result = serializeSavingsGoalMovement({
      id: "gm1",
      goalId: "g1",
      kind: "WITHDRAWAL",
      amount: "50",
      description: "",
      occurredAt: now,
      createdAt: now,
    })
    expect(result.kind).toBe("WITHDRAWAL")
    expect(result.amount).toBe(50)
  })
})
