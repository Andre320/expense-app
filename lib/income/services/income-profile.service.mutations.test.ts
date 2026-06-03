import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  deleteIncomeProfile,
  patchCurrentIncomeProfileSalary,
  syncAppSettingsMirror,
  updateIncomeProfile,
} from "@/lib/income/services/income-profile.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

const closedRow = {
  id: "closed",
  label: "Past",
  effectiveFrom: new Date("2023-01-01"),
  effectiveTo: new Date("2023-12-31"),
  crSalaryGross: "700000",
  crSalaryCurrency: "CRC",
  crPayPeriod: "MONTHLY",
  crSolidaristaPct: "0",
  crPensionComplementariaPct: "0",
  crEsppPct: "0",
  position: 1,
}

describe("income-profile.service mutations", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"

  beforeEach(() => {
    vi.clearAllMocks()
    ensureModel(prisma, "incomeProfile").count!.mockResolvedValue(1)
    ensureModel(prisma, "incomeProfile").findMany!.mockResolvedValue([])
    ensureModel(prisma, "appSettings").update!.mockResolvedValue({})
    ensureModel(prisma, "incomeProfile").delete!.mockResolvedValue({})
  })

  it("updates and deletes profile", async () => {
    ensureModel(prisma, "incomeProfile").findFirst!.mockResolvedValue({
      id: "p1",
      userId,
      label: "Old",
      effectiveFrom: new Date("2024-01-01"),
      effectiveTo: null,
      crSalaryGross: "800000",
      crSalaryCurrency: "CRC",
      crPayPeriod: "MONTHLY",
      crSolidaristaPct: "0",
      crPensionComplementariaPct: "0",
      crEsppPct: "0",
      position: 1,
    })
    ensureModel(prisma, "incomeProfile").findMany!.mockResolvedValue([
      {
        id: "p1",
        label: "Old",
        effectiveFrom: new Date("2024-01-01"),
        effectiveTo: null,
        crSalaryGross: "800000",
        crSalaryCurrency: "CRC",
        crPayPeriod: "MONTHLY",
        crSolidaristaPct: "0",
        crPensionComplementariaPct: "0",
        crEsppPct: "0",
        position: 1,
      },
    ])
    ensureModel(prisma, "incomeProfile").update!.mockResolvedValue({
      id: "p1",
      label: "Renamed",
      effectiveFrom: new Date("2024-01-01"),
      effectiveTo: new Date("2024-12-31"),
      crSalaryGross: "900000",
      crSalaryCurrency: "USD",
      crPayPeriod: "BIWEEKLY",
      crSolidaristaPct: "1",
      crPensionComplementariaPct: "2",
      crEsppPct: "3",
      position: 9,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const updated = await updateIncomeProfile(prisma, userId, "p1", {
      label: "Renamed",
      effectiveFrom: "2024-02-01",
      effectiveTo: "2024-12-31",
      crSalaryGross: 900000,
      crSalaryCurrency: "USD",
      crPayPeriod: "BIWEEKLY",
      crSolidaristaPct: 1,
      crPensionComplementariaPct: 2,
      crEsppPct: 3,
      position: 9,
    })
    expect(updated.label).toBe("Renamed")

    await deleteIncomeProfile(prisma, userId, "p1")
    expect(prisma.incomeProfile.delete).toHaveBeenCalled()
  })

  it("throws when update or delete target is missing", async () => {
    ensureModel(prisma, "incomeProfile").findFirst!.mockResolvedValue(null)
    await expect(deleteIncomeProfile(prisma, userId, "missing")).rejects.toThrow("Not found")
    await expect(updateIncomeProfile(prisma, userId, "missing", { label: "x" })).rejects.toThrow(
      "Not found",
    )
  })

  it("syncAppSettingsMirror mirrors latest closed profile", async () => {
    ensureModel(prisma, "incomeProfile").findMany!.mockResolvedValue([
      {
        id: "old",
        label: "2024",
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
      {
        id: "newer",
        label: "2025",
        effectiveFrom: new Date("2025-01-01"),
        effectiveTo: new Date("2025-06-01"),
        crSalaryGross: "920000",
        crSalaryCurrency: "CRC",
        crPayPeriod: "MONTHLY",
        crSolidaristaPct: "0",
        crPensionComplementariaPct: "0",
        crEsppPct: "0",
        position: 2,
      },
    ])
    await syncAppSettingsMirror(prisma, userId)
    expect(prisma.appSettings.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ crSalaryGross: "920000" }),
      }),
    )
  })

  it("patchCurrentIncomeProfileSalary creates or updates profile", async () => {
    ensureModel(prisma, "incomeProfile").findMany!.mockResolvedValue([closedRow])
    ensureModel(prisma, "appSettings").findUniqueOrThrow!.mockResolvedValue({
      userId,
      crSalaryGross: "850000",
      crSalaryCurrency: "CRC",
      crPayPeriod: "MONTHLY",
      crSolidaristaPct: "0",
      crPensionComplementariaPct: "0",
      crEsppPct: "0",
    })
    ensureModel(prisma, "incomeProfile").create!.mockResolvedValue({
      ...closedRow,
      id: "new",
      effectiveTo: null,
    })
    ensureModel(prisma, "incomeProfile").update!.mockResolvedValue({
      ...closedRow,
      crSalaryGross: "900000",
    })

    await patchCurrentIncomeProfileSalary(prisma, userId, { crSalaryGross: 900000 })
    expect(prisma.incomeProfile.create).toHaveBeenCalled()

    ensureModel(prisma, "incomeProfile").findMany!.mockResolvedValue([
      { ...closedRow, effectiveTo: null, id: "open" },
    ])
    await patchCurrentIncomeProfileSalary(prisma, userId, { crSalaryGross: 950000 })
    expect(prisma.incomeProfile.update).toHaveBeenCalled()
  })
})
