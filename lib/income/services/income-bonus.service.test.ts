import { beforeEach, describe, expect, it } from "vitest"
import {
  createIncomeBonus,
  deleteIncomeBonus,
  listSerializedIncomeBonuses,
  updateIncomeBonus,
} from "@/lib/income/services/income-bonus.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("income-bonus.service", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"
  const now = new Date("2026-05-01T00:00:00.000Z")

  const bonusRow = {
    id: "bonus-1",
    userId,
    name: "Annual",
    grossAmount: "500000",
    grossCurrency: "CRC",
    months: "[12]",
    position: 1,
    createdAt: now,
    updatedAt: now,
  }

  beforeEach(() => {
    ensureModel(prisma, "incomeBonus").findMany!.mockResolvedValue([bonusRow])
    ensureModel(prisma, "incomeBonus").aggregate!.mockResolvedValue({ _max: { position: 1 } })
    ensureModel(prisma, "incomeBonus").create!.mockResolvedValue({
      ...bonusRow,
      id: "bonus-2",
      name: "Q1",
      position: 2,
    })
    ensureModel(prisma, "incomeBonus").findFirst!.mockResolvedValue(bonusRow)
    ensureModel(prisma, "incomeBonus").update!.mockResolvedValue({
      ...bonusRow,
      name: "Updated",
    })
    ensureModel(prisma, "incomeBonus").delete!.mockResolvedValue(bonusRow)
  })

  it("lists serialized bonuses", async () => {
    const rows = await listSerializedIncomeBonuses(prisma, userId)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.name).toBe("Annual")
    expect(rows[0]!.months).toEqual([12])
  })

  it("uses position 1 when no prior bonuses exist", async () => {
    ensureModel(prisma, "incomeBonus").aggregate!.mockResolvedValue({ _max: { position: null } })
    await createIncomeBonus(prisma, userId, {
      name: "First",
      grossAmount: 1,
      months: [1],
    })
    expect(prisma.incomeBonus.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ position: 1 }) }),
    )
  })

  it("creates bonus with next position", async () => {
    const created = await createIncomeBonus(prisma, userId, {
      name: "Q1",
      grossAmount: 100000,
      months: [3],
    })
    expect(created.name).toBe("Q1")
    expect(prisma.incomeBonus.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId, position: 2, months: "[3]" }),
      }),
    )
  })

  it("creates bonus with explicit currency and position", async () => {
    await createIncomeBonus(prisma, userId, {
      name: "USD Bonus",
      grossAmount: 1000,
      grossCurrency: "USD",
      months: [6],
      position: 9,
    })
    expect(prisma.incomeBonus.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          grossCurrency: "USD",
          position: 9,
        }),
      }),
    )
  })

  it("updates owned bonus", async () => {
    const updated = await updateIncomeBonus(prisma, userId, "bonus-1", { name: "Updated" })
    expect(updated.name).toBe("Updated")
  })

  it("updates all bonus fields", async () => {
    await updateIncomeBonus(prisma, userId, "bonus-1", {
      name: "Renamed",
      grossAmount: 200000,
      grossCurrency: "USD",
      months: [1, 7],
      position: 3,
    })
    expect(prisma.incomeBonus.update).toHaveBeenCalledWith({
      where: { id: "bonus-1" },
      data: {
        name: "Renamed",
        grossAmount: "200000",
        grossCurrency: "USD",
        months: "[1,7]",
        position: 3,
      },
    })
  })

  it("throws when updating missing bonus", async () => {
    ensureModel(prisma, "incomeBonus").findFirst!.mockResolvedValue(null)
    await expect(updateIncomeBonus(prisma, userId, "missing", { name: "X" })).rejects.toThrow(
      "Not found",
    )
  })

  it("deletes owned bonus", async () => {
    await deleteIncomeBonus(prisma, userId, "bonus-1")
    expect(prisma.incomeBonus.delete).toHaveBeenCalledWith({ where: { id: "bonus-1" } })
  })

  it("throws when deleting missing bonus", async () => {
    ensureModel(prisma, "incomeBonus").findFirst!.mockResolvedValue(null)
    await expect(deleteIncomeBonus(prisma, userId, "missing")).rejects.toThrow("Not found")
  })
})
