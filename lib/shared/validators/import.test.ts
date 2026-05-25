import { describe, expect, it } from "vitest"
import { csvImportZ } from "@/lib/shared/validators"

describe("csvImportZ", () => {
  it("accepts a minimal valid payload", () => {
    const r = csvImportZ.safeParse({
      rows: [
        {
          occurredAt: "2025-01-01T00:00:00.000Z",
          kind: "EXPENSE",
          amountOriginal: 10,
          currencyCode: "USD",
        },
      ],
    })
    expect(r.success).toBe(true)
  })

  it("rejects empty rows array", () => {
    const r = csvImportZ.safeParse({ rows: [] })
    expect(r.success).toBe(false)
  })

  it("rejects more than 5000 rows", () => {
    const r = csvImportZ.safeParse({
      rows: Array.from({ length: 5001 }, () => ({
        occurredAt: "2025-01-01T00:00:00.000Z",
        kind: "EXPENSE" as const,
        amountOriginal: 1,
        currencyCode: "USD",
      })),
    })
    expect(r.success).toBe(false)
  })

  it("rejects non-positive amount", () => {
    const r = csvImportZ.safeParse({
      rows: [
        {
          occurredAt: "2025-01-01T00:00:00.000Z",
          kind: "EXPENSE",
          amountOriginal: 0,
          currencyCode: "USD",
        },
      ],
    })
    expect(r.success).toBe(false)
  })

  it("rejects invalid currency code length", () => {
    const r = csvImportZ.safeParse({
      rows: [
        {
          occurredAt: "2025-01-01T00:00:00.000Z",
          kind: "EXPENSE",
          amountOriginal: 10,
          currencyCode: "US",
        },
      ],
    })
    expect(r.success).toBe(false)
  })
})
