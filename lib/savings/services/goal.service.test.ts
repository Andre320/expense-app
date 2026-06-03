import { beforeEach, describe, expect, it, vi } from "vitest"
import { applySavingsGoalMovement } from "@/lib/savings/services/movement.service"
import {
  createSavingsGoal,
  deleteSavingsGoal,
  listSerializedSavingsGoals,
  updateSavingsGoal,
} from "@/lib/savings/services/goal.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

vi.mock("@/lib/savings/services/movement.service", () => ({
  applySavingsGoalMovement: vi.fn().mockResolvedValue({}),
}))

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
    ensureModel(prisma, "savingsGoal").findFirst!.mockResolvedValue(goalRow)
    ensureModel(prisma, "savingsGoal").update!.mockResolvedValue(goalRow)
    ensureModel(prisma, "savingsGoal").delete!.mockResolvedValue(goalRow)
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

  it("updates owned goal fields", async () => {
    const updated = await updateSavingsGoal(prisma, userId, "goal-1", { name: "Trip" })
    expect(updated.name).toBe("Vacation")
    expect(prisma.savingsGoal.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "Trip" }) }),
    )
  })

  it("clears target and updates optional metadata", async () => {
    await updateSavingsGoal(prisma, userId, "goal-1", {
      targetAmount: null,
      priorityOrder: 3,
      color: "#000",
      notes: "note",
    })
    expect(prisma.savingsGoal.update).toHaveBeenCalledWith({
      where: { id: "goal-1" },
      data: {
        targetAmount: null,
        priorityOrder: 3,
        color: "#000",
        notes: "note",
      },
    })
  })

  it("stringifies numeric targetAmount on update", async () => {
    await updateSavingsGoal(prisma, userId, "goal-1", { targetAmount: 250000 })
    expect(prisma.savingsGoal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ targetAmount: "250000" }),
      }),
    )
  })

  it("throws when updating missing goal", async () => {
    ensureModel(prisma, "savingsGoal").findFirst!.mockResolvedValue(null)
    await expect(updateSavingsGoal(prisma, userId, "missing", { name: "X" })).rejects.toThrow(
      "Not found",
    )
  })

  it("applies adjustment movement when currentAmount changes", async () => {
    await updateSavingsGoal(prisma, userId, "goal-1", { currentAmount: 20000 })
    expect(applySavingsGoalMovement).toHaveBeenCalledWith(prisma, userId, "goal-1", {
      kind: "ADJUSTMENT",
      amount: 20000,
      description: "Balance correction",
    })
  })

  it("skips movement when currentAmount is unchanged", async () => {
    await updateSavingsGoal(prisma, userId, "goal-1", { currentAmount: 10000 })
    expect(applySavingsGoalMovement).not.toHaveBeenCalled()
  })

  it("throws not found when goal update fails in database", async () => {
    ensureModel(prisma, "savingsGoal").update!.mockRejectedValue(new Error("db"))
    await expect(updateSavingsGoal(prisma, userId, "goal-1", { name: "Trip" })).rejects.toThrow(
      "Not found",
    )
  })

  it("deletes owned goal", async () => {
    await deleteSavingsGoal(prisma, userId, "goal-1")
    expect(prisma.savingsGoal.delete).toHaveBeenCalledWith({ where: { id: "goal-1" } })
  })

  it("throws when deleting missing goal", async () => {
    ensureModel(prisma, "savingsGoal").findFirst!.mockResolvedValue(null)
    await expect(deleteSavingsGoal(prisma, userId, "missing")).rejects.toThrow("Not found")
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
