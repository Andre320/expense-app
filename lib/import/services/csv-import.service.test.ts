import { beforeEach, describe, expect, it } from "vitest"
import { importCsvTransactions } from "@/lib/import/services/csv-import.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("csv-import.service", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"

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
    ensureModel(prisma, "transaction").create!.mockResolvedValue({ id: "tx-1" })
  })

  it("creates transactions from valid rows", async () => {
    const result = await importCsvTransactions(prisma, userId, {
      rows: [
        {
          occurredAt: "2026-05-01T00:00:00.000Z",
          kind: "EXPENSE",
          description: "Groceries",
          amountOriginal: 5000,
          currencyCode: "CRC",
          categoryName: "Food",
        },
      ],
    })

    expect(result.created).toBe(1)
    expect(result.errors).toEqual([])
    expect(prisma.transaction.create).toHaveBeenCalledOnce()
  })

  it("collects errors for invalid dates without stopping import", async () => {
    const result = await importCsvTransactions(prisma, userId, {
      rows: [
        {
          occurredAt: "bad-date",
          kind: "EXPENSE",
          amountOriginal: 100,
          currencyCode: "CRC",
        },
        {
          occurredAt: "2026-05-02T00:00:00.000Z",
          kind: "EXPENSE",
          amountOriginal: 200,
          currencyCode: "CRC",
        },
      ],
    })

    expect(result.created).toBe(1)
    expect(result.errors).toEqual(["Row 1: invalid date"])
  })

  it("ignores blank categoryId and resolves by name", async () => {
    await importCsvTransactions(prisma, userId, {
      rows: [
        {
          occurredAt: "2026-05-01T00:00:00.000Z",
          kind: "EXPENSE",
          amountOriginal: 100,
          currencyCode: "CRC",
          categoryId: "   ",
          categoryName: "Food",
        },
      ],
    })
    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: { userId, name: { equals: "Food" }, kind: "EXPENSE" },
    })
  })

  it("resolves category by id when provided", async () => {
    await importCsvTransactions(prisma, userId, {
      rows: [
        {
          occurredAt: "2026-05-01T00:00:00.000Z",
          kind: "EXPENSE",
          amountOriginal: 100,
          currencyCode: "CRC",
          categoryId: "cat-1",
        },
      ],
    })

    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: { id: "cat-1", userId, kind: "EXPENSE" },
    })
  })

  it("resolves category by name when id is absent", async () => {
    await importCsvTransactions(prisma, userId, {
      rows: [
        {
          occurredAt: "2026-05-01T00:00:00.000Z",
          kind: "EXPENSE",
          amountOriginal: 100,
          currencyCode: "CRC",
          categoryName: "Food",
        },
      ],
    })

    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: { userId, name: { equals: "Food" }, kind: "EXPENSE" },
    })
  })

  it("imports row without category when lookup misses", async () => {
    ensureModel(prisma, "category").findFirst!.mockResolvedValue(null)
    const result = await importCsvTransactions(prisma, userId, {
      rows: [
        {
          occurredAt: "2026-05-01T00:00:00.000Z",
          kind: "EXPENSE",
          amountOriginal: 100,
          currencyCode: "CRC",
          categoryName: "Missing",
        },
      ],
    })
    expect(result.created).toBe(1)
    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ categoryId: null }),
      }),
    )
  })
})
