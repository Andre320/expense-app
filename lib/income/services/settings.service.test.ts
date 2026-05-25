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

  beforeEach(() => {
    ensureModel(prisma, "appSettings").findUniqueOrThrow!.mockResolvedValue(baseSettings)
    ensureModel(prisma, "appSettings").update!.mockResolvedValue({
      ...baseSettings,
      crSalaryGross: "2000000",
    })
  })

  it("getSerializedSettings returns serialized settings", async () => {
    const result = await getSerializedSettings(prisma, userId)
    expect(result.crSalaryGross).toBe(1000000)
    expect(result.crCrcPerUsd).toBe(505)
  })

  it("patchSerializedSettings updates provided fields only", async () => {
    const result = await patchSerializedSettings(prisma, userId, {
      crSalaryGross: 2000000,
    })

    expect(prisma.appSettings.update).toHaveBeenCalledWith({
      where: { userId },
      data: { crSalaryGross: "2000000" },
    })
    expect(result.crSalaryGross).toBe(2000000)
  })

  it("patchSerializedSettings can update every salary profile field", async () => {
    ensureModel(prisma, "appSettings").update!.mockResolvedValue({
      ...baseSettings,
      crSalaryCurrency: "USD",
      crPayPeriod: "BIWEEKLY",
      crCrcPerUsd: "510",
      crSolidaristaPct: "1",
      crPensionComplementariaPct: "2",
      crEsppPct: "3",
    })

    await patchSerializedSettings(prisma, userId, {
      crSalaryGross: 2000000,
      crSalaryCurrency: "USD",
      crPayPeriod: "BIWEEKLY",
      crCrcPerUsd: 510,
      crSolidaristaPct: 1,
      crPensionComplementariaPct: 2,
      crEsppPct: 3,
    })

    expect(prisma.appSettings.update).toHaveBeenCalledWith({
      where: { userId },
      data: {
        crSalaryGross: "2000000",
        crSalaryCurrency: "USD",
        crPayPeriod: "BIWEEKLY",
        crCrcPerUsd: "510",
        crSolidaristaPct: "1",
        crPensionComplementariaPct: "2",
        crEsppPct: "3",
      },
    })
  })
})
