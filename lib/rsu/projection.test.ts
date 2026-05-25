import { describe, expect, it } from "vitest"
import { projectVestScenarios, projectVestValue } from "@/lib/rsu/projection"

describe("projectVestScenarios", () => {
  it("returns bear, base, and bull projections", () => {
    const scenarios = projectVestScenarios(100, 22, { bear: 80, base: 100, bull: 120 })
    expect(scenarios.base.priceUsd).toBe(100)
    expect(scenarios.bear.netUsd).toBeLessThan(scenarios.base.netUsd)
    expect(scenarios.bull.netUsd).toBeGreaterThan(scenarios.base.netUsd)
  })
})

describe("projectVestValue", () => {
  it("includes gross and net share counts", () => {
    const projection = projectVestValue(47.5, 22, 180.25)
    expect(projection.grossShares).toBe(47.5)
    expect(projection.netWholeShares).toBeGreaterThan(0)
    expect(projection.netUsd).toBeGreaterThan(0)
  })
})
