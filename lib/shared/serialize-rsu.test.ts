import { describe, expect, it } from "vitest"
import { serializeRsuPlan, serializeRsuVest } from "@/lib/shared/serialize"

const now = new Date("2026-05-01T12:00:00.000Z")

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
