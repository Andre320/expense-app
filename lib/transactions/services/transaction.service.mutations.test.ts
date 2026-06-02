import { beforeEach, describe, expect, it } from "vitest"
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/lib/transactions/services/transaction.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("transaction.service mutations", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"
  const now = new Date("2026-05-01T12:00:00.000Z")

  const existingTx = {
    id: "tx-1",
    userId,
    occurredAt: now,
    kind: "EXPENSE" as const,
    description: "Coffee",
    categoryId: "cat-1",
    amountOriginal: "5000",
    currencyCode: "CRC",
    rateToBase: "1",
    amountBase: "5000",
    rateToQuote: "0.002",
    amountQuote: "10",
    createdAt: now,
    updatedAt: now,
    category: { id: "cat-1", name: "Food", kind: "EXPENSE", userId, color: null, position: 1 },
    tags: [],
  }

  beforeEach(() => {
    ensureModel(prisma, "appSettings").findUniqueOrThrow!.mockResolvedValue({
      id: "s1",
      userId,
      crCrcPerUsd: "500",
    })
    ensureModel(prisma, "category").findFirst!.mockResolvedValue({
      id: "cat-1",
      userId,
      name: "Food",
      kind: "EXPENSE",
    })
    ensureModel(prisma, "tag").count!.mockResolvedValue(1)
    ensureModel(prisma, "transaction").create!.mockResolvedValue(existingTx)
    ensureModel(prisma, "transaction").findFirst!.mockResolvedValue({ ...existingTx, tags: [] })
    ensureModel(prisma, "transaction").update!.mockResolvedValue({
      ...existingTx,
      description: "Updated",
    })
    ensureModel(prisma, "transaction").delete!.mockResolvedValue(existingTx)
    ensureModel(prisma, "transactionTag").deleteMany!.mockResolvedValue({ count: 0 })
    prisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (Array.isArray(arg)) return Promise.all(arg)
      if (typeof arg === "function") return (arg as (tx: typeof prisma) => unknown)(prisma)
      return arg
    })
  })

  it("creates transaction with dual amounts", async () => {
    const created = await createTransaction(prisma, userId, {
      occurredAt: now.toISOString(),
      kind: "EXPENSE",
      description: "Coffee",
      categoryId: "cat-1",
      amountOriginal: 5000,
      currencyCode: "CRC",
      tagIds: ["tag-1"],
    })
    expect(created.amountBase).toBe(5000)
    expect(prisma.transaction.create).toHaveBeenCalled()
  })

  it("rejects invalid occurredAt on create", async () => {
    await expect(
      createTransaction(prisma, userId, {
        occurredAt: "not-a-date",
        kind: "EXPENSE",
        amountOriginal: 100,
        currencyCode: "CRC",
      }),
    ).rejects.toThrow("Invalid occurredAt")
  })

  it("rejects invalid tags on create", async () => {
    ensureModel(prisma, "tag").count!.mockResolvedValue(0)
    await expect(
      createTransaction(prisma, userId, {
        occurredAt: now.toISOString(),
        kind: "EXPENSE",
        amountOriginal: 100,
        currencyCode: "CRC",
        tagIds: ["tag-missing"],
      }),
    ).rejects.toThrow("Invalid tag")
  })

  it("updates owned transaction", async () => {
    const updated = await updateTransaction(prisma, userId, "tx-1", {
      description: "Updated",
    })
    expect(updated.description).toBe("Updated")
  })

  it("throws when updating missing transaction", async () => {
    ensureModel(prisma, "transaction").findFirst!.mockResolvedValue(null)
    await expect(updateTransaction(prisma, userId, "missing", {})).rejects.toThrow("Not found")
  })

  it("deletes owned transaction", async () => {
    await deleteTransaction(prisma, userId, "tx-1")
    expect(prisma.transaction.delete).toHaveBeenCalledWith({ where: { id: "tx-1" } })
  })

  it("rejects invalid category on create", async () => {
    ensureModel(prisma, "category").findFirst!.mockResolvedValue(null)
    await expect(
      createTransaction(prisma, userId, {
        occurredAt: now.toISOString(),
        kind: "EXPENSE",
        amountOriginal: 100,
        currencyCode: "CRC",
        categoryId: "missing",
      }),
    ).rejects.toThrow("Category not found")
  })

  it("creates transaction without category or tags", async () => {
    await createTransaction(prisma, userId, {
      occurredAt: now.toISOString(),
      kind: "EXPENSE",
      amountOriginal: 100,
      currencyCode: "USD",
    })
    expect(prisma.transaction.create).toHaveBeenCalled()
  })

  it("updates tags and validates category", async () => {
    await updateTransaction(prisma, userId, "tx-1", {
      tagIds: ["tag-1"],
      categoryId: "cat-1",
      amountOriginal: 200,
      currencyCode: "usd",
      occurredAt: now.toISOString(),
      kind: "INCOME",
      description: "Bonus",
    })
    expect(prisma.transactionTag.deleteMany).toHaveBeenCalled()
  })

  it("rejects invalid occurredAt on update", async () => {
    await expect(
      updateTransaction(prisma, userId, "tx-1", { occurredAt: "bad-date" }),
    ).rejects.toThrow("Invalid occurredAt")
  })

  it("rejects invalid tags on update", async () => {
    ensureModel(prisma, "tag").count!.mockResolvedValue(0)
    await expect(
      updateTransaction(prisma, userId, "tx-1", { tagIds: ["missing"] }),
    ).rejects.toThrow("Invalid tag")
  })

  it("rejects invalid category on update", async () => {
    ensureModel(prisma, "category").findFirst!.mockResolvedValue(null)
    await expect(
      updateTransaction(prisma, userId, "tx-1", { categoryId: "missing" }),
    ).rejects.toThrow("Category not found")
  })

  it("throws when deleting missing transaction", async () => {
    ensureModel(prisma, "transaction").findFirst!.mockResolvedValue(null)
    await expect(deleteTransaction(prisma, userId, "missing")).rejects.toThrow("Not found")
  })
})
