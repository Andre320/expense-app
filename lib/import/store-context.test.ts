import { beforeEach, describe, expect, it, vi } from "vitest"

const { findMany, findUnique } = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
}))

vi.mock("@/lib/db/client", () => ({
  prisma: {
    knownStore: { findMany },
    category: { findUnique },
  },
}))

import { loadStoreMappingContext } from "@/lib/import/store-context"

describe("loadStoreMappingContext", () => {
  beforeEach(() => {
    findMany.mockReset()
    findUnique.mockReset()
    findMany.mockResolvedValue([
      {
        id: "store-1",
        pattern: "SUPER",
        displayName: "Supermarket",
        categoryId: "cat-1",
        position: 0,
      },
    ])
    findUnique.mockResolvedValue({ id: "cat-uncat" })
  })

  it("loads store rules and uncategorized category id", async () => {
    const ctx = await loadStoreMappingContext("user-1")
    expect(ctx.rules).toHaveLength(1)
    expect(ctx.uncategorizedCategoryId).toBe("cat-uncat")
  })

  it("throws when uncategorized category is missing", async () => {
    findUnique.mockResolvedValue(null)
    await expect(loadStoreMappingContext("user-1")).rejects.toThrow(
      "Uncategorized expense category missing",
    )
  })
})
