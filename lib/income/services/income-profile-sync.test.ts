import { beforeEach, describe, expect, it } from "vitest"
import { ensureIncomeProfilesFromSettings } from "@/lib/income/services/income-profile-sync"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("income-profile-sync", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"

  beforeEach(() => {
    ensureModel(prisma, "incomeProfile").count!.mockResolvedValue(0)
    ensureModel(prisma, "appSettings").findUnique!.mockResolvedValue(null)
  })

  it("ensureIncomeProfilesFromSettings no-ops without settings row", async () => {
    await ensureIncomeProfilesFromSettings(prisma, userId)
    expect(prisma.incomeProfile.create).not.toHaveBeenCalled()
  })

  it("backfill uses now when user createdAt is missing", async () => {
    ensureModel(prisma, "appSettings").findUnique!.mockResolvedValue({
      userId,
      crSalaryGross: "0",
      crSalaryCurrency: "CRC",
      crPayPeriod: "MONTHLY",
      crSolidaristaPct: "0",
      crPensionComplementariaPct: "0",
      crEsppPct: "0",
    })
    ensureModel(prisma, "user").findUnique!.mockResolvedValue(null)
    ensureModel(prisma, "incomeProfile").create!.mockResolvedValue({})
    await ensureIncomeProfilesFromSettings(prisma, userId)
    expect(prisma.incomeProfile.create).toHaveBeenCalled()
  })
})
