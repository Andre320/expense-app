import { beforeEach, describe, expect, it } from "vitest"
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/lib/categories/services/category.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("category.service", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"

  const foodCategory = {
    id: "cat-1",
    userId,
    name: "Food",
    kind: "EXPENSE" as const,
    color: "#fb923c",
    position: 2,
  }

  const uncategorized = {
    id: "cat-uncat",
    userId,
    name: "Uncategorized",
    kind: "EXPENSE" as const,
    color: "#71717a",
    position: 99,
  }

  beforeEach(() => {
    ensureModel(prisma, "category").findMany!.mockResolvedValue([foodCategory, uncategorized])
    ensureModel(prisma, "category").aggregate!.mockResolvedValue({ _max: { position: 2 } })
    ensureModel(prisma, "category").create!.mockResolvedValue({
      id: "cat-new",
      userId,
      name: "Travel",
      kind: "EXPENSE",
      color: "#6366f1",
      position: 3,
    })
    ensureModel(prisma, "category").findFirst!.mockResolvedValue(foodCategory)
    ensureModel(prisma, "category").update!.mockResolvedValue({
      ...foodCategory,
      name: "Groceries",
    })
    ensureModel(prisma, "category").delete!.mockResolvedValue(foodCategory)
  })

  it("lists categories ordered", async () => {
    const rows = await listCategories(prisma, userId)
    expect(rows).toHaveLength(2)
    expect(rows[0]!.name).toBe("Food")
  })

  it("creates category with next position", async () => {
    const created = await createCategory(prisma, userId, {
      name: "  Travel  ",
      kind: "EXPENSE",
    })
    expect(created.name).toBe("Travel")
    expect(prisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Travel", position: 3 }),
      }),
    )
  })

  it("throws on duplicate category create", async () => {
    ensureModel(prisma, "category").create!.mockRejectedValue(new Error("unique"))
    await expect(createCategory(prisma, userId, { name: "Food", kind: "EXPENSE" })).rejects.toThrow(
      "A category with this name and type already exists",
    )
  })

  it("updates owned category", async () => {
    const updated = await updateCategory(prisma, userId, "cat-1", { name: "Groceries" })
    expect(updated.name).toBe("Groceries")
  })

  it("blocks renaming uncategorized", async () => {
    ensureModel(prisma, "category").findFirst!.mockResolvedValue(uncategorized)
    await expect(updateCategory(prisma, userId, "cat-uncat", { name: "Other" })).rejects.toThrow(
      "The Uncategorized category cannot be renamed or retyped",
    )
  })

  it("deletes owned category", async () => {
    await deleteCategory(prisma, userId, "cat-1")
    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: "cat-1" } })
  })

  it("blocks deleting uncategorized", async () => {
    ensureModel(prisma, "category").findFirst!.mockResolvedValue(uncategorized)
    await expect(deleteCategory(prisma, userId, "cat-uncat")).rejects.toThrow(
      "The Uncategorized category cannot be deleted",
    )
  })

  it("throws when updating missing category", async () => {
    ensureModel(prisma, "category").findFirst!.mockResolvedValue(null)
    await expect(updateCategory(prisma, userId, "missing", { name: "X" })).rejects.toThrow(
      "Not found",
    )
  })

  it("throws when update fails in database", async () => {
    ensureModel(prisma, "category").update!.mockRejectedValue(new Error("unique"))
    await expect(updateCategory(prisma, userId, "cat-1", { name: "Dup" })).rejects.toThrow(
      "Update failed (duplicate name for this type?)",
    )
  })

  it("throws when deleting missing category", async () => {
    ensureModel(prisma, "category").findFirst!.mockResolvedValue(null)
    await expect(deleteCategory(prisma, userId, "missing")).rejects.toThrow("Not found")
  })

  it("starts position at 1 when no categories of kind exist", async () => {
    ensureModel(prisma, "category").aggregate!.mockResolvedValue({ _max: { position: null } })
    await createCategory(prisma, userId, { name: "First", kind: "INCOME" })
    expect(prisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ position: 1 }) }),
    )
  })

  it("creates category with default color when omitted", async () => {
    await createCategory(prisma, userId, { name: "Misc", kind: "INCOME" })
    expect(prisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ color: "#6366f1" }),
      }),
    )
  })

  it("updates category color and kind", async () => {
    ensureModel(prisma, "category").update!.mockResolvedValue({
      ...foodCategory,
      color: "#000000",
      kind: "INCOME",
    })
    const updated = await updateCategory(prisma, userId, "cat-1", {
      color: "#000000",
      kind: "INCOME",
    })
    expect(updated.color).toBe("#000000")
    expect(updated.kind).toBe("INCOME")
  })
})
