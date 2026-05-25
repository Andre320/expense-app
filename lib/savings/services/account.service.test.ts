import { beforeEach, describe, expect, it } from "vitest"
import {
  createSavingsAccount,
  deleteSavingsAccount,
  listSerializedSavingsAccounts,
  updateSavingsAccount,
} from "@/lib/savings/services/account.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("account.service", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"
  const now = new Date("2026-05-01T00:00:00.000Z")

  const accountRow = {
    id: "acct-1",
    userId,
    name: "Emergency",
    currency: "CRC",
    balance: "1000",
    notes: null,
    position: 0,
    createdAt: now,
    updatedAt: now,
  }

  beforeEach(() => {
    ensureModel(prisma, "savingsAccount").findMany!.mockResolvedValue([accountRow])
    ensureModel(prisma, "savingsAccount").aggregate!.mockResolvedValue({ _max: { position: 0 } })
    ensureModel(prisma, "savingsAccount").findFirst!.mockResolvedValue(accountRow)
    ensureModel(prisma, "savingsAccount").create!.mockResolvedValue(accountRow)
    ensureModel(prisma, "savingsAccount").update!.mockResolvedValue({
      ...accountRow,
      name: "Updated",
    })
    ensureModel(prisma, "savingsAccount").delete!.mockResolvedValue(accountRow)
    ensureModel(prisma, "savingsAccountMovement").create!.mockResolvedValue({
      id: "mov-1",
      accountId: "acct-1",
      kind: "INITIAL",
      amount: "500",
      description: "Opening balance",
      occurredAt: now,
      createdAt: now,
    })
  })

  it("lists serialized accounts", async () => {
    const rows = await listSerializedSavingsAccounts(prisma, userId)
    expect(rows[0]!.name).toBe("Emergency")
  })

  it("creates account with opening balance movement", async () => {
    const created = await createSavingsAccount(prisma, userId, {
      name: "New",
      balance: 500,
    })
    expect(created.name).toBe("Emergency")
    expect(prisma.savingsAccountMovement.create).toHaveBeenCalled()
  })

  it("updates owned account", async () => {
    const updated = await updateSavingsAccount(prisma, userId, "acct-1", { name: "Updated" })
    expect(updated.name).toBe("Updated")
  })

  it("deletes owned account", async () => {
    await deleteSavingsAccount(prisma, userId, "acct-1")
    expect(prisma.savingsAccount.delete).toHaveBeenCalledWith({ where: { id: "acct-1" } })
  })

  it("throws when updating missing account", async () => {
    ensureModel(prisma, "savingsAccount").findFirst!.mockResolvedValue(null)
    await expect(updateSavingsAccount(prisma, userId, "missing", { name: "X" })).rejects.toThrow(
      "Not found",
    )
  })

  it("throws when deleting missing account", async () => {
    ensureModel(prisma, "savingsAccount").findFirst!.mockResolvedValue(null)
    await expect(deleteSavingsAccount(prisma, userId, "missing")).rejects.toThrow("Not found")
  })
})
