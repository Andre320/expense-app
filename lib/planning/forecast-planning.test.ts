import { describe, expect, it } from "vitest"
import {
  goalsForForecast,
  liveNetCrcToExpectedIncomeBase,
  monthlySurplusForForecast,
  savingsGoalMilestones,
  type SavingsGoalForecastInput,
} from "@/lib/planning/forecast-planning"

describe("monthlySurplusForForecast", () => {
  it("subtracts expenses and rounds to cents", () => {
    expect(monthlySurplusForForecast(5000.126, 1000.004)).toBe(4000.12)
  })

  it("allows negative surplus", () => {
    expect(monthlySurplusForForecast(100, 500)).toBe(-400)
  })
})

describe("goalsForForecast", () => {
  it("converts USD goal amounts to CRC for forecast", () => {
    const normalized = goalsForForecast(
      [
        {
          id: "usd",
          name: "USD goal",
          currency: "USD",
          targetAmount: 1000,
          currentAmount: 200,
          priorityOrder: 1,
        },
      ],
      500,
    )
    expect(normalized[0]!.currentAmount).toBe(100_000)
    expect(normalized[0]!.targetAmount).toBe(500_000)
  })

  it("keeps CRC amounts when currency is omitted", () => {
    const normalized = goalsForForecast(
      [{ id: "crc", name: "CRC goal", targetAmount: 1000, currentAmount: 200, priorityOrder: 1 }],
      500,
    )
    expect(normalized[0]!.currentAmount).toBe(200)
    expect(normalized[0]!.targetAmount).toBe(1000)
  })
})

describe("savingsGoalMilestones", () => {
  const g = (
    over: Partial<SavingsGoalForecastInput> & Pick<SavingsGoalForecastInput, "id">,
  ): SavingsGoalForecastInput => ({
    id: over.id,
    name: over.name ?? "Goal",
    targetAmount: over.targetAmount !== undefined ? over.targetAmount : 1000,
    currentAmount: over.currentAmount ?? 0,
    priorityOrder: over.priorityOrder ?? 0,
  })

  it("waterfalls surplus across two goals by priority", () => {
    const goals = [
      g({ id: "b", name: "B", priorityOrder: 2, targetAmount: 600, currentAmount: 0 }),
      g({ id: "a", name: "A", priorityOrder: 1, targetAmount: 400, currentAmount: 0 }),
    ]
    const m = savingsGoalMilestones(goals, 100)
    const byId = Object.fromEntries(m.map((x) => [x.goalId, x]))
    expect(byId.a.monthsForThisGoal).toBe(4)
    expect(byId.a.monthsFromNowWhenComplete).toBe(4)
    expect(byId.b.monthsForThisGoal).toBe(6)
    expect(byId.b.monthsFromNowWhenComplete).toBe(10)
  })

  it("returns null months when surplus is zero", () => {
    const goals = [g({ id: "1", targetAmount: 100, currentAmount: 0, priorityOrder: 0 })]
    const m = savingsGoalMilestones(goals, 0)
    expect(m[0]!.monthsForThisGoal).toBeNull()
    expect(m[0]!.monthsFromNowWhenComplete).toBeNull()
  })

  it("returns null months when surplus is negative", () => {
    const goals = [g({ id: "1", targetAmount: 100, currentAmount: 0 })]
    const m = savingsGoalMilestones(goals, -50)
    expect(m[0]!.monthsForThisGoal).toBeNull()
  })

  it("marks already-funded goal with zero months and does not advance cumulative for gap zero", () => {
    const goals = [
      g({ id: "done", targetAmount: 100, currentAmount: 100, priorityOrder: 1 }),
      g({ id: "next", targetAmount: 300, currentAmount: 0, priorityOrder: 2 }),
    ]
    const m = savingsGoalMilestones(goals, 100)
    const done = m.find((x) => x.goalId === "done")!
    const next = m.find((x) => x.goalId === "next")!
    expect(done.monthsForThisGoal).toBe(0)
    expect(done.monthsFromNowWhenComplete).toBe(0)
    expect(next.monthsForThisGoal).toBe(3)
    expect(next.monthsFromNowWhenComplete).toBe(3)
  })

  it("treats null target as open-ended (null gap and months)", () => {
    const goals = [g({ id: "open", name: "Open", targetAmount: null, currentAmount: 0 })]
    const m = savingsGoalMilestones(goals, 500)
    expect(m[0]!.gapToTarget).toBeNull()
    expect(m[0]!.monthsForThisGoal).toBeNull()
    expect(m[0]!.progressPct).toBeNull()
  })

  it("computes progressPct capped at 100", () => {
    const goals = [g({ id: "1", targetAmount: 100, currentAmount: 150 })]
    const m = savingsGoalMilestones(goals, 10)
    expect(m[0]!.progressPct).toBe(100)
  })
})

describe("liveNetCrcToExpectedIncomeBase", () => {
  it("returns CRC net as reporting amount", () => {
    expect(liveNetCrcToExpectedIncomeBase({ netMonthlyCrc: 500_000 })).toBe(500_000)
  })
})
