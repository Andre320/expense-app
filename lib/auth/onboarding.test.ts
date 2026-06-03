import { beforeEach, describe, expect, it, vi } from "vitest"
import { ensureUserDefaults } from "@/lib/auth/onboarding"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("ensureUserDefaults", () => {
  const prisma = createMockPrisma()

  beforeEach(() => {
    vi.clearAllMocks()
    ensureModel(prisma, "appSettings").upsert!.mockResolvedValue({})
    ensureModel(prisma, "category").upsert!.mockResolvedValue({})
    ensureModel(prisma, "incomeProfile").count!.mockResolvedValue(1)
    ensureModel(prisma, "appSettings").findUnique!.mockResolvedValue({
      userId: "user-1",
      crSalaryGross: "0",
      crSalaryCurrency: "CRC",
      crPayPeriod: "MONTHLY",
      crSolidaristaPct: "0",
      crPensionComplementariaPct: "0",
      crEsppPct: "0",
    })
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
