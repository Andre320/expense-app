import { beforeEach, describe, expect, it, vi } from "vitest"
import { ensureUserDefaults } from "@/lib/auth/onboarding"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("ensureUserDefaults", () => {
  const prisma = createMockPrisma()

  beforeEach(() => {
    vi.clearAllMocks()
    ensureModel(prisma, "appSettings").upsert!.mockResolvedValue({})
    ensureModel(prisma, "category").upsert!.mockResolvedValue({})
  })

  it("creates default app settings", async () => {
    await ensureUserDefaults("user-1", prisma)

    expect(prisma.appSettings.upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      create: { userId: "user-1" },
      update: {},
    })
  })

  it("upserts all default categories", async () => {
    await ensureUserDefaults("user-1", prisma)

    expect(prisma.category.upsert).toHaveBeenCalledTimes(7)
    expect(prisma.category.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_name_kind: { userId: "user-1", name: "Uncategorized", kind: "EXPENSE" },
        },
      }),
    )
  })
})
