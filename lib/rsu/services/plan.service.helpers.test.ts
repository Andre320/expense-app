import { describe, expect, it } from "vitest"
import { parseGrantDate, vestSummaryInput } from "@/lib/rsu/services/plan.service.helpers"

describe("plan.service.helpers", () => {
  it("parseGrantDate accepts ISO strings", () => {
    const d = parseGrantDate("2024-01-15T00:00:00.000Z")
    expect(d.toISOString()).toBe("2024-01-15T00:00:00.000Z")
  })

  it("parseGrantDate rejects invalid values", () => {
    expect(() => parseGrantDate("not-a-date")).toThrow("Invalid grantDate")
  })

  it("vestSummaryInput maps received vest fields", () => {
    const input = vestSummaryInput({
      sequence: 2,
      scheduledDate: new Date("2024-06-01"),
      shares: { toString: () => "100" },
      status: "RECEIVED",
      netShares: { toString: () => "80" },
      cashBonusUsd: { toString: () => "12.5" },
    })
    expect(input.netShares).toBe(80)
    expect(input.cashBonusUsd).toBe(12.5)
  })

  it("vestSummaryInput leaves optional fields null", () => {
    const input = vestSummaryInput({
      sequence: 1,
      scheduledDate: new Date(),
      shares: { toString: () => "50" },
      status: "PENDING",
      netShares: null,
      cashBonusUsd: null,
    })
    expect(input.netShares).toBeNull()
    expect(input.cashBonusUsd).toBeNull()
  })
})
