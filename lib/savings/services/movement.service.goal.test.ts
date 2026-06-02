import { beforeEach, describe, expect, it } from "vitest"
import {
  applySavingsGoalMovement,
  listSavingsGoalMovements,
} from "@/lib/savings/services/movement.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("movement.service goals", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"
  const now = new Date("2026-05-01T00:00:00.000Z")

  beforeEach(() => {
    ensureModel(prisma, "savingsGoal").findFirst!.mockResolvedValue({
      id: "goal-1",
      userId,
      name: "Vacation",
      currency: "CRC",
      currentAmount: "200",
      targetAmount: "1000",
      color: null,
      notes: null,
      priorityOrder: 0,
      createdAt: now,
      updatedAt: now,
    })
    ensureModel(prisma, "savingsGoal").update!.mockImplementation(({ data }) =>
      Promise.resolve({
        id: "goal-1",
        currentAmount: data.currentAmount,
      }),
    )
    ensureModel(prisma, "savingsGoalMovement").create!.mockImplementation(({ data }) =>
      Promise.resolve({
        id: "gm-1",
        goalId: data.goalId,
        kind: data.kind,
        amount: data.amount,
        description: data.description,
        occurredAt: data.occurredAt ?? now,
        createdAt: now,
      }),
    )
    ensureModel(prisma, "savingsGoalMovement").findMany!.mockResolvedValue([
      {
        id: "gm-1",
        goalId: "goal-1",
        kind: "DEPOSIT",
        amount: "100",
        description: "",
        occurredAt: now,
        createdAt: now,
      },
    ])
  })

  it("applies goal movement", async () => {
    const result = await applySavingsGoalMovement(prisma, userId, "goal-1", {
      kind: "DEPOSIT",
      amount: 100,
    })
    expect(result.goal.currentAmount).toBe(300)
  })

  it("lists goal movements for owned goal", async () => {
    const rows = await listSavingsGoalMovements(prisma, userId, "goal-1")
    expect(rows).toHaveLength(1)
  })

  it("throws when goal movement target is missing", async () => {
    ensureModel(prisma, "savingsGoal").findFirst!.mockResolvedValue(null)
    await expect(
      applySavingsGoalMovement(prisma, userId, "missing", {
        kind: "DEPOSIT",
        amount: 10,
      }),
    ).rejects.toThrow("Not found")
  })

  it("throws when listing goal movements for missing goal", async () => {
    ensureModel(prisma, "savingsGoal").findFirst!.mockResolvedValue(null)
    await expect(listSavingsGoalMovements(prisma, userId, "missing")).rejects.toThrow("Not found")
  })

  it("rejects goal withdrawal exceeding balance", async () => {
    await expect(
      applySavingsGoalMovement(prisma, userId, "goal-1", {
        kind: "WITHDRAWAL",
        amount: 5000,
      }),
    ).rejects.toThrow("Insufficient balance")
  })

  it("applies goal withdrawal", async () => {
    const result = await applySavingsGoalMovement(prisma, userId, "goal-1", {
      kind: "WITHDRAWAL",
      amount: 50,
    })
    expect(result.goal.currentAmount).toBe(150)
  })

  it("applies goal adjustment to absolute balance", async () => {
    const result = await applySavingsGoalMovement(prisma, userId, "goal-1", {
      kind: "ADJUSTMENT",
      amount: 500,
    })
    expect(result.goal.currentAmount).toBe(500)
  })
})
