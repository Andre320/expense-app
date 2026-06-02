import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  createKnownStore,
  deleteKnownStore,
  listKnownStores,
  updateKnownStore,
} from "@/lib/store/services/known-store.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("known-store.service", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"
  const now = new Date("2026-05-01T00:00:00.000Z")

  const storeRow = {
    id: "store-1",
    userId,
    pattern: "SUPERMARKET",
    displayName: "Groceries",
    categoryId: "cat-1",
    position: 1,
    createdAt: now,
    updatedAt: now,
    category: { id: "cat-1", name: "Food", kind: "EXPENSE" },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ensureModel(prisma, "knownStore").findMany!.mockResolvedValue([storeRow])
    ensureModel(prisma, "category").findFirst!.mockResolvedValue({
      id: "cat-1",
      userId,
      name: "Food",
      kind: "EXPENSE",
    })
    ensureModel(prisma, "knownStore").aggregate!.mockResolvedValue({ _max: { position: 1 } })
    ensureModel(prisma, "knownStore").create!.mockResolvedValue(storeRow)
    ensureModel(prisma, "knownStore").findFirst!.mockResolvedValue(storeRow)
    ensureModel(prisma, "knownStore").update!.mockResolvedValue({
      ...storeRow,
      displayName: "Updated",
    })
    ensureModel(prisma, "knownStore").delete!.mockResolvedValue(storeRow)
  })

  it("lists known stores with category metadata", async () => {
    const rows = await listKnownStores(prisma, userId)
    expect(rows[0]).toMatchObject({
      pattern: "SUPERMARKET",
      categoryName: "Food",
      categoryKind: "EXPENSE",
    })
  })

  it("creates store mapping when category exists", async () => {
    ensureModel(prisma, "knownStore").findMany!.mockResolvedValue([])
    const created = await createKnownStore(prisma, userId, {
      pattern: " SUPERMARKET ",
      displayName: " Groceries ",
      categoryId: "cat-1",
    })
    expect(created.pattern).toBe("SUPERMARKET")
    expect(prisma.knownStore.create).toHaveBeenCalled()
  })

  it("rejects duplicate pattern on create", async () => {
    ensureModel(prisma, "knownStore").findMany!.mockResolvedValue([{ pattern: "supermarket" }])
    await expect(
      createKnownStore(prisma, userId, {
        pattern: "Supermarket",
        displayName: "Dup",
        categoryId: "cat-1",
      }),
    ).rejects.toThrow("A mapping with this pattern already exists")
  })

  it("rejects missing category on create", async () => {
    ensureModel(prisma, "category").findFirst!.mockResolvedValue(null)
    await expect(
      createKnownStore(prisma, userId, {
        pattern: "NEW",
        displayName: "New",
        categoryId: "missing",
      }),
    ).rejects.toThrow("Category not found")
  })

  it("updates owned store", async () => {
    const updated = await updateKnownStore(prisma, userId, "store-1", {
      displayName: "Updated",
    })
    expect(updated.displayName).toBe("Updated")
  })

  it("deletes owned store", async () => {
    await deleteKnownStore(prisma, userId, "store-1")
    expect(prisma.knownStore.delete).toHaveBeenCalledWith({ where: { id: "store-1" } })
  })

  it("throws when updating missing store", async () => {
    ensureModel(prisma, "knownStore").findFirst!.mockResolvedValue(null)
    await expect(updateKnownStore(prisma, userId, "missing", { displayName: "X" })).rejects.toThrow(
      "Not found",
    )
  })

  it("rejects update with missing category", async () => {
    ensureModel(prisma, "category").findFirst!.mockResolvedValue(null)
    await expect(
      updateKnownStore(prisma, userId, "store-1", { categoryId: "missing" }),
    ).rejects.toThrow("Category not found")
  })

  it("rejects duplicate pattern on update", async () => {
    ensureModel(prisma, "knownStore").findMany!.mockResolvedValue([{ pattern: "other" }])
    await expect(updateKnownStore(prisma, userId, "store-1", { pattern: "OTHER" })).rejects.toThrow(
      "Another mapping already uses this pattern",
    )
  })

  it("throws not found when update fails", async () => {
    ensureModel(prisma, "knownStore").update!.mockRejectedValue(new Error("db"))
    await expect(
      updateKnownStore(prisma, userId, "store-1", { displayName: "Broken" }),
    ).rejects.toThrow("Not found")
  })

  it("throws when deleting missing store", async () => {
    ensureModel(prisma, "knownStore").findFirst!.mockResolvedValue(null)
    await expect(deleteKnownStore(prisma, userId, "missing")).rejects.toThrow("Not found")
  })

  it("updates display name only without pattern or category checks", async () => {
    const updated = await updateKnownStore(prisma, userId, "store-1", {
      displayName: "Renamed only",
    })
    expect(updated.displayName).toBe("Updated")
    expect(prisma.category.findFirst).not.toHaveBeenCalled()
  })

  it("updates pattern without touching category when only pattern changes", async () => {
    ensureModel(prisma, "knownStore").findMany!.mockResolvedValue([])
    await updateKnownStore(prisma, userId, "store-1", { pattern: "NEW-PATTERN" })
    expect(prisma.knownStore.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ pattern: "NEW-PATTERN" }),
      }),
    )
  })

  it("updates category when categoryId provided", async () => {
    await updateKnownStore(prisma, userId, "store-1", { categoryId: "cat-2" })
    expect(prisma.category.findFirst).toHaveBeenCalled()
  })

  it("assigns position when no prior stores exist", async () => {
    ensureModel(prisma, "knownStore").findMany!.mockResolvedValue([])
    ensureModel(prisma, "knownStore").aggregate!.mockResolvedValue({ _max: { position: null } })
    await createKnownStore(prisma, userId, {
      pattern: "NEW",
      displayName: "New",
      categoryId: "cat-1",
    })
    expect(prisma.knownStore.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ position: 1 }) }),
    )
  })
})
