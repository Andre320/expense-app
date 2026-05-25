import { beforeEach, describe, expect, it } from "vitest"
import { listTags, upsertTag } from "@/lib/shared/services/tag.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("tag.service", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"

  beforeEach(() => {
    ensureModel(prisma, "tag").findMany!.mockResolvedValue([
      { id: "tag-1", name: "daily", userId },
      { id: "tag-2", name: "work", userId },
    ])
    ensureModel(prisma, "tag").upsert!.mockResolvedValue({ id: "tag-3", name: "travel", userId })
  })

  it("lists tags sorted by name", async () => {
    const tags = await listTags(prisma, userId)
    expect(tags).toEqual([
      { id: "tag-1", name: "daily" },
      { id: "tag-2", name: "work" },
    ])
    expect(prisma.tag.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { name: "asc" },
    })
  })

  it("upserts tag by user and name", async () => {
    const tag = await upsertTag(prisma, userId, "travel")
    expect(tag).toEqual({ id: "tag-3", name: "travel" })
    expect(prisma.tag.upsert).toHaveBeenCalledWith({
      where: { userId_name: { userId, name: "travel" } },
      create: { userId, name: "travel" },
      update: {},
    })
  })
})
