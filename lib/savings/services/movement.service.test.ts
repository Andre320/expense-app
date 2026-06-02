import { beforeEach, describe, expect, it } from "vitest"
import {
  applySavingsAccountMovement,
  listSavingsAccountMovements,
} from "@/lib/savings/services/movement.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("movement.service", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"
  const now = new Date("2026-05-01T00:00:00.000Z")

  beforeEach(() => {
    ensureModel(prisma, "savingsAccount").findFirst!.mockResolvedValue({
      id: "acct-1",
      userId,
      name: "Emergency",
      currency: "CRC",
      balance: "1000",
      notes: null,
      position: 0,
      createdAt: now,
      updatedAt: now,
    })
    ensureModel(prisma, "savingsAccount").update!.mockImplementation(({ data }) =>
      Promise.resolve({
        id: "acct-1",
        userId,
        name: "Emergency",
        currency: "CRC",
        balance: data.balance,
        notes: null,
        position: 0,
        createdAt: now,
        updatedAt: now,
      }),
    )
    ensureModel(prisma, "savingsAccountMovement").create!.mockImplementation(({ data }) =>
      Promise.resolve({
        id: "mov-1",
        accountId: data.accountId,
        kind: data.kind,
        amount: data.amount,
        description: data.description,
        occurredAt: data.occurredAt ?? now,
        createdAt: now,
      }),
    )
    ensureModel(prisma, "savingsAccountMovement").findMany!.mockResolvedValue([
      {
        id: "mov-1",
        accountId: "acct-1",
        kind: "DEPOSIT",
        amount: "500",
        description: "",
        occurredAt: now,
        createdAt: now,
      },
    ])

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

  it("applies deposit to savings account", async () => {
    const result = await applySavingsAccountMovement(prisma, userId, "acct-1", {
      kind: "DEPOSIT",
      amount: 500,
    })
    expect(result.account.balance).toBe(1500)
    expect(result.movement.kind).toBe("DEPOSIT")
  })

  it("throws when account not owned", async () => {
    ensureModel(prisma, "savingsAccount").findFirst!.mockResolvedValue(null)
    await expect(
      applySavingsAccountMovement(prisma, userId, "missing", {
        kind: "DEPOSIT",
        amount: 100,
      }),
    ).rejects.toThrow("Not found")
  })

  it("lists account movements for owned account", async () => {
    const rows = await listSavingsAccountMovements(prisma, userId, "acct-1")
    expect(rows).toHaveLength(1)
    expect(rows[0]!.amount).toBe(500)
  })

  it("applies withdrawal from account", async () => {
    const result = await applySavingsAccountMovement(prisma, userId, "acct-1", {
      kind: "WITHDRAWAL",
      amount: 200,
    })
    expect(result.account.balance).toBe(800)
  })

  it("applies adjustment to account", async () => {
    const result = await applySavingsAccountMovement(prisma, userId, "acct-1", {
      kind: "ADJUSTMENT",
      amount: 750,
    })
    expect(result.account.balance).toBe(750)
  })

  it("applies initial balance movement", async () => {
    const result = await applySavingsAccountMovement(prisma, userId, "acct-1", {
      kind: "INITIAL",
      amount: 50,
    })
    expect(result.account.balance).toBe(1050)
  })

  it("rejects invalid occurredAt", async () => {
    await expect(
      applySavingsAccountMovement(prisma, userId, "acct-1", {
        kind: "DEPOSIT",
        amount: 10,
        occurredAt: "bad-date",
      }),
    ).rejects.toThrow("Invalid occurredAt")
  })

  it("rejects withdrawal exceeding balance", async () => {
    await expect(
      applySavingsAccountMovement(prisma, userId, "acct-1", {
        kind: "WITHDRAWAL",
        amount: 5000,
      }),
    ).rejects.toThrow("Insufficient balance")
  })

  it("throws when listing movements for missing account", async () => {
    ensureModel(prisma, "savingsAccount").findFirst!.mockResolvedValue(null)
    await expect(listSavingsAccountMovements(prisma, userId, "missing")).rejects.toThrow(
      "Not found",
    )
  })

  it("uses current time when occurredAt omitted", async () => {
    await applySavingsAccountMovement(prisma, userId, "acct-1", {
      kind: "DEPOSIT",
      amount: 10,
    })
    expect(prisma.savingsAccountMovement.create).toHaveBeenCalled()
  })

  it("parses explicit occurredAt", async () => {
    const occurredAt = "2026-06-15T10:00:00.000Z"
    await applySavingsAccountMovement(prisma, userId, "acct-1", {
      kind: "DEPOSIT",
      amount: 10,
      occurredAt,
    })
    expect(prisma.savingsAccountMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ occurredAt: new Date(occurredAt) }),
      }),
    )
  })
})
