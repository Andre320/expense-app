import { describe, expect, it } from "vitest"
import { transactionCreateZ } from "@/lib/shared/validators"

describe("transactionCreateZ", () => {
  it("accepts valid transaction", () => {
    const r = transactionCreateZ.safeParse({
      occurredAt: "2025-01-01T00:00:00.000Z",
      kind: "INCOME",
      amountOriginal: 100,
      currencyCode: "CRC",
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.description).toBe("")
  })

  it("rejects empty occurredAt", () => {
    const r = transactionCreateZ.safeParse({
      occurredAt: "",
      kind: "EXPENSE",
      amountOriginal: 1,
      currencyCode: "USD",
    })
    expect(r.success).toBe(false)
  })

  it("rejects invalid kind", () => {
    const r = transactionCreateZ.safeParse({
      occurredAt: "2025-01-01T00:00:00.000Z",
      kind: "OTHER",
      amountOriginal: 1,
      currencyCode: "USD",
    })
    expect(r.success).toBe(false)
  })
})
