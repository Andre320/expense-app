import { beforeEach, describe, expect, it } from "vitest"
import { listTransactions } from "@/lib/transactions/services/transaction.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("transaction.service list", () => {
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
    ensureModel(prisma, "transaction").count!.mockResolvedValue(1)
    ensureModel(prisma, "transaction").findMany!.mockResolvedValue([existingTx])
  })

  it("lists transactions with pagination", async () => {
    const result = await listTransactions(prisma, userId, {
      page: 1,
      pageSize: 20,
      kind: "EXPENSE",
      q: "coffee",
      sortBy: "amountBase",
      sortDir: "asc",
    })
    expect(result.total).toBe(1)
    expect(result.items[0]!.description).toBe("Coffee")
  })

  it("lists without optional filters and falls back sort field", async () => {
    const result = await listTransactions(prisma, userId, {
      page: 0,
      pageSize: 200,
      kind: "OTHER",
      sortBy: "unknown",
      sortDir: "asc",
    })
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(100)
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { occurredAt: "asc" },
      }),
    )
  })

  it("filters income transactions", async () => {
    await listTransactions(prisma, userId, {
      page: 1,
      pageSize: 10,
      kind: "INCOME",
    })
    expect(prisma.transaction.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ kind: "INCOME" }),
      }),
    )
  })
})
