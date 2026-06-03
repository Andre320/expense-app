import { beforeEach, describe, expect, it } from "vitest"
import {
  ensureIncomeProfilesFromSettings,
  repairProfileVoluntaryDeductions,
} from "@/lib/income/services/income-profile-sync"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("income-profile-sync", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"

  beforeEach(() => {
    ensureModel(prisma, "incomeProfile").count!.mockResolvedValue(0)
    ensureModel(prisma, "incomeProfile").findMany!.mockResolvedValue([])
    ensureModel(prisma, "incomeProfile").update!.mockClear()
    ensureModel(prisma, "appSettings").findUnique!.mockResolvedValue(null)
  })

  it("ensureIncomeProfilesFromSettings no-ops without settings row", async () => {
    await ensureIncomeProfilesFromSettings(prisma, userId)
    expect(prisma.incomeProfile.create).not.toHaveBeenCalled()
  })

  it("repairProfileVoluntaryDeductions copies fallback pct onto zero profiles", async () => {
    ensureModel(prisma, "appSettings").findUnique!.mockResolvedValue({
      crSolidaristaPct: "2",
      crPensionComplementariaPct: "1",
      crEsppPct: "3",
    })
    ensureModel(prisma, "incomeProfile").findMany!.mockResolvedValue([
      {
        id: "p1",
        label: "Old",
        effectiveFrom: new Date("2024-01-01"),
        effectiveTo: new Date("2024-12-31"),
        crSalaryGross: "800000",
        crSalaryCurrency: "CRC",
        crPayPeriod: "MONTHLY",
        crSolidaristaPct: "0",
        crPensionComplementariaPct: "0",
        crEsppPct: "0",
        position: 1,
      },
    ])
    await repairProfileVoluntaryDeductions(prisma, userId)
    expect(prisma.incomeProfile.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: {
        crSolidaristaPct: "2",
        crPensionComplementariaPct: "1",
        crEsppPct: "3",
      },
    })
  })

  it("repairProfileVoluntaryDeductions no-ops without fallback", async () => {
    await repairProfileVoluntaryDeductions(prisma, userId)
    expect(prisma.incomeProfile.update).not.toHaveBeenCalled()
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
