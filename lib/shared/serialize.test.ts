import { describe, expect, it } from "vitest"
import { serializeSettings, serializeTransaction } from "@/lib/shared/serialize"

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

  it("handles undefined tags array", () => {
    const result = serializeTransaction({
      id: "t3",
      userId: "u1",
      occurredAt: now,
      kind: "EXPENSE",
      description: "No tags",
      categoryId: null,
      category: null,
      amountOriginal: "10",
      currencyCode: "CRC",
      rateToBase: "1",
      amountBase: "10",
      rateToQuote: "1",
      amountQuote: "10",
      tags: undefined,
      createdAt: now,
      updatedAt: now,
    })
    expect(result.tags).toEqual([])
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
