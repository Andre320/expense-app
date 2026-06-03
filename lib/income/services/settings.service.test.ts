import { beforeEach, describe, expect, it } from "vitest"
import {
  getSerializedSettings,
  patchSerializedSettings,
} from "@/lib/income/services/settings.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("settings.service", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"

  const baseSettings = {
    id: "settings-1",
    userId,
    crSalaryGross: "1000000",
    crSalaryCurrency: "CRC",
    crPayPeriod: "MONTHLY",
    crCrcPerUsd: "505",
    crSolidaristaPct: "0",
    crPensionComplementariaPct: "0",
    crEsppPct: "0",
    updatedAt: new Date("2026-05-01T00:00:00.000Z"),
  }

  const openProfile = {
    id: "prof-1",
    userId,
    label: "Salary",
    effectiveFrom: new Date("2024-01-01"),
    effectiveTo: null,
    crSalaryGross: "1000000",
    crSalaryCurrency: "CRC",
    crPayPeriod: "MONTHLY",
    crSolidaristaPct: "0",
    crPensionComplementariaPct: "0",
    crEsppPct: "0",
    position: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    ensureModel(prisma, "incomeProfile").count!.mockResolvedValue(1)
    ensureModel(prisma, "incomeProfile").findMany!.mockResolvedValue([openProfile])
    ensureModel(prisma, "appSettings").findUniqueOrThrow!.mockResolvedValue(baseSettings)
    ensureModel(prisma, "appSettings").findUnique!.mockResolvedValue(baseSettings)
    ensureModel(prisma, "appSettings").update!.mockResolvedValue({
      ...baseSettings,
      crSalaryGross: "2000000",
    })
    ensureModel(prisma, "incomeProfile").update!.mockResolvedValue({
      ...openProfile,
      crSalaryGross: "2000000",
    })
  })

  it("getSerializedSettings returns serialized settings", async () => {
    const result = await getSerializedSettings(prisma, userId)
    expect(result.crSalaryGross).toBe(1000000)
    expect(result.crCrcPerUsd).toBe(505)
  })

  it("patchSerializedSettings updates salary on current profile", async () => {
    const result = await patchSerializedSettings(prisma, userId, {
      crSalaryGross: 2000000,
    })

    expect(prisma.incomeProfile.update).toHaveBeenCalled()
    expect(result.crSalaryGross).toBe(2000000)
  })

  it("patchSerializedSettings updates all salary fields on profile", async () => {
    ensureModel(prisma, "appSettings").update!.mockResolvedValue(baseSettings)
    await patchSerializedSettings(prisma, userId, {
      crSalaryGross: 2000000,
      crSalaryCurrency: "USD",
      crPayPeriod: "BIWEEKLY",
      crSolidaristaPct: 1,
      crPensionComplementariaPct: 2,
      crEsppPct: 3,
    })
    expect(prisma.incomeProfile.update).toHaveBeenCalled()
  })

  it("patchSerializedSettings updates crc rate on app settings only", async () => {
    ensureModel(prisma, "appSettings").update!.mockResolvedValue({
      ...baseSettings,
      crCrcPerUsd: "510",
    })

    await patchSerializedSettings(prisma, userId, {
      crCrcPerUsd: 510,
    })

    expect(prisma.appSettings.update).toHaveBeenCalledWith({
      where: { userId },
      data: { crCrcPerUsd: "510" },
    })
  })
})
