import { describe, expect, it } from "vitest"
import { rsuPlanCreateZ, rsuPlanUpdateZ, rsuVestReceiveZ } from "@/lib/shared/validators/rsu"

describe("rsuPlanCreateZ", () => {
  it("accepts valid plan", () => {
    const r = rsuPlanCreateZ.safeParse({
      name: "2024 Grant",
      ticker: "SNOW",
      totalShares: 1000,
      grantDate: "2024-01-15T00:00:00.000Z",
    })
    expect(r.success).toBe(true)
  })

  it("rejects non-positive shares", () => {
    expect(
      rsuPlanCreateZ.safeParse({
        name: "X",
        ticker: "SNOW",
        totalShares: 0,
        grantDate: "2024-01-15T00:00:00.000Z",
      }).success,
    ).toBe(false)
  })
})

describe("rsuPlanUpdateZ", () => {
  it("accepts tax withhold patch", () => {
    expect(rsuPlanUpdateZ.safeParse({ taxWithholdPct: 22 }).success).toBe(true)
  })
})

describe("rsuVestReceiveZ", () => {
  it("accepts optional receivedAt", () => {
    expect(rsuVestReceiveZ.safeParse({}).success).toBe(true)
    expect(rsuVestReceiveZ.safeParse({ receivedAt: "2024-04-20" }).success).toBe(true)
  })
})
