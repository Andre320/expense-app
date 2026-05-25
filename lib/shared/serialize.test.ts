import { describe, expect, it } from "vitest"
import {
  serializeIncomeBonus,
  serializeRsuPlan,
  serializeRsuVest,
  serializeSavings,
  serializeSavingsAccount,
  serializeSavingsAccountMovement,
  serializeSavingsGoalMovement,
  serializeSettings,
  serializeTransaction,
} from "@/lib/shared/serialize"

const now = new Date("2026-05-01T12:00:00.000Z")

describe("serializeSettings", () => {
  it("converts decimals and dates", () => {
    const result = serializeSettings({
      id: "s1",
      crSalaryGross: "1500000",
      crSalaryCurrency: "CRC",
      crPayPeriod: "MONTHLY",
      crCrcPerUsd: "505",
      crSolidaristaPct: "5",
      crPensionComplementariaPct: "2",
      crEsppPct: "10",
      updatedAt: now,
    })
    expect(result).toEqual({
      id: "s1",
      crSalaryGross: 1500000,
      crSalaryCurrency: "CRC",
      crPayPeriod: "MONTHLY",
      crCrcPerUsd: 505,
      crSolidaristaPct: 5,
      crPensionComplementariaPct: 2,
      crEsppPct: 10,
      updatedAt: now.toISOString(),
    })
  })
})

describe("serializeTransaction", () => {
  it("serializes nested category and tags", () => {
    const result = serializeTransaction({
      id: "t1",
      userId: "u1",
      occurredAt: now,
      kind: "EXPENSE",
      description: "Coffee",
      categoryId: "c1",
      category: { id: "c1", name: "Food", kind: "EXPENSE", userId: "u1", color: null, position: 1 },
      amountOriginal: "5000",
      currencyCode: "CRC",
      rateToBase: "1",
      amountBase: "5000",
      rateToQuote: "0.00198",
      amountQuote: "9.9",
      tags: [{ tag: { id: "tag1", name: "daily", userId: "u1" } }],
      createdAt: now,
      updatedAt: now,
    })
    expect(result.category).toEqual({ id: "c1", name: "Food", kind: "EXPENSE" })
    expect(result.tags).toEqual([{ id: "tag1", name: "daily" }])
    expect(result.amountBase).toBe(5000)
  })

  it("handles missing category and empty tags", () => {
    const result = serializeTransaction({
      id: "t2",
      userId: "u1",
      occurredAt: now,
      kind: "INCOME",
      description: "",
      categoryId: null,
      category: null,
      amountOriginal: "100",
      currencyCode: "USD",
      rateToBase: "500",
      amountBase: "50000",
      rateToQuote: "1",
      amountQuote: "100",
      tags: [],
      createdAt: now,
      updatedAt: now,
    })
    expect(result.category).toBeNull()
    expect(result.tags).toEqual([])
  })
})

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

describe("serializeRsuPlan", () => {
  it("serializes plan decimals and dates", () => {
    const result = serializeRsuPlan({
      id: "p1",
      userId: "u1",
      name: "2024 Grant",
      ticker: "SNOW",
      totalShares: "1000",
      grantDate: now,
      vestingPeriodMonths: 48,
      vestIntervalMonths: 3,
      vestDayOfMonth: 15,
      taxWithholdPct: "22",
      notes: null,
      position: 0,
      createdAt: now,
      updatedAt: now,
    })
    expect(result.totalShares).toBe(1000)
    expect(result.taxWithholdPct).toBe(22)
    expect(result.grantDate).toBe(now.toISOString())
  })
})

describe("serializeRsuVest", () => {
  it("handles optional received fields", () => {
    const result = serializeRsuVest({
      id: "v1",
      planId: "p1",
      sequence: 1,
      scheduledDate: now,
      shares: "250",
      status: "PENDING",
      receivedAt: null,
      sharesWithheld: null,
      netShares: null,
      cashBonusUsd: null,
      createdAt: now,
      updatedAt: now,
    })
    expect(result.receivedAt).toBeNull()
    expect(result.shares).toBe(250)
  })

  it("serializes received vest values", () => {
    const result = serializeRsuVest({
      id: "v2",
      planId: "p1",
      sequence: 2,
      scheduledDate: now,
      shares: "250",
      status: "RECEIVED",
      receivedAt: now,
      sharesWithheld: "55",
      netShares: "195",
      cashBonusUsd: "100",
      createdAt: now,
      updatedAt: now,
    })
    expect(result.netShares).toBe(195)
    expect(result.cashBonusUsd).toBe(100)
  })
})
