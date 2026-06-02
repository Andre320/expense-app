import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSavingsGoal, listSerializedSavingsGoals } from "@/lib/savings/services/goal.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("goal.service", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"
  const now = new Date("2026-05-01T00:00:00.000Z")

  const goalRow = {
    id: "goal-1",
    userId,
    name: "Vacation",
    currency: "CRC",
    targetAmount: "500000",
    currentAmount: "10000",
    color: "#fff",
    notes: null,
    priorityOrder: 1,
    createdAt: now,
    updatedAt: now,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ensureModel(prisma, "savingsGoal").findMany!.mockResolvedValue([goalRow])
    ensureModel(prisma, "savingsGoal").aggregate!.mockResolvedValue({ _max: { priorityOrder: 1 } })
    ensureModel(prisma, "savingsGoal").create!.mockResolvedValue(goalRow)
    ensureModel(prisma, "savingsGoalMovement").create!.mockResolvedValue({
      id: "gm-1",
      goalId: "goal-1",
      kind: "INITIAL",
      amount: "10000",
      description: "Already saved",
      occurredAt: now,
      createdAt: now,
    })
  })

  it("lists serialized goals", async () => {
    const rows = await listSerializedSavingsGoals(prisma, userId)
    expect(rows[0]!.name).toBe("Vacation")
  })

  it("defaults currentAmount to zero when omitted", async () => {
    prisma.$transaction.mockImplementation(async (fn) => {
      if (typeof fn === "function") return fn(prisma)
      return fn
    })
    await createSavingsGoal(prisma, userId, {
      name: "Empty start",
      targetAmount: 100,
    })
    expect(prisma.savingsGoalMovement.create).not.toHaveBeenCalled()
    expect(prisma.savingsGoal.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currentAmount: "0" }) }),
    )
  })

  it("creates goal with opening movement", async () => {
    const created = await createSavingsGoal(prisma, userId, {
      name: "Vacation",
      currentAmount: 10000,
      targetAmount: 500000,
    })
    expect(created.currentAmount).toBe(10000)
    expect(prisma.savingsGoalMovement.create).toHaveBeenCalled()
  })

  it("uses next priority when aggregate max is null", async () => {
    ensureModel(prisma, "savingsGoal").aggregate!.mockResolvedValue({
      _max: { priorityOrder: null },
    })
    await createSavingsGoal(prisma, userId, {
      name: "First goal",
      currentAmount: 0,
      targetAmount: 100,
    })
    expect(prisma.savingsGoal.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ priorityOrder: 1 }) }),
    )
  })

  it("honors explicit priorityOrder over aggregate default", async () => {
    prisma.$transaction.mockImplementation(async (fn) => {
      if (typeof fn === "function") return fn(prisma)
      return fn
    })
    await createSavingsGoal(prisma, userId, {
      name: "Priority 9",
      currentAmount: 0,
      targetAmount: 100,
      priorityOrder: 9,
    })
    expect(prisma.savingsGoal.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ priorityOrder: 9 }) }),
    )
  })

  it("creates goal without opening movement when amount is zero", async () => {
    prisma.$transaction.mockImplementation(async (fn) => {
      if (typeof fn === "function") return fn(prisma)
      return fn
    })
    await createSavingsGoal(prisma, userId, {
      name: "Future",
      currentAmount: 0,
      targetAmount: null,
      currency: "USD",
      priorityOrder: 5,
    })
    expect(prisma.savingsGoalMovement.create).not.toHaveBeenCalled()
    expect(prisma.savingsGoal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currency: "USD",
          targetAmount: null,
          priorityOrder: 5,
        }),
      }),
    )
  })
})
