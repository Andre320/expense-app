import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  createIncomeProfile,
  ensureIncomeProfilesFromSettings,
  IncomeProfileValidationError,
  listSerializedIncomeProfiles,
} from "@/lib/income/services/income-profile.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("income-profile.service create", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"

  beforeEach(() => {
    ensureModel(prisma, "incomeProfile").count!.mockResolvedValue(0)
    ensureModel(prisma, "incomeProfile").findMany!.mockResolvedValue([])
    ensureModel(prisma, "appSettings").findUnique!.mockResolvedValue({
      userId,
      crSalaryGross: "850000",
      crSalaryCurrency: "CRC",
      crPayPeriod: "MONTHLY",
      crSolidaristaPct: "0",
      crPensionComplementariaPct: "0",
      crEsppPct: "0",
    })
    ensureModel(prisma, "user").findUnique!.mockResolvedValue({
      id: userId,
      createdAt: new Date("2024-01-01"),
    })
    ensureModel(prisma, "incomeProfile").create!.mockImplementation(({ data }) =>
      Promise.resolve({
        id: "prof-1",
        userId,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    )
    ensureModel(prisma, "appSettings").update!.mockResolvedValue({})
    ensureModel(prisma, "incomeProfile").aggregate!.mockResolvedValue({ _max: { position: 0 } })
  })

  it("backfills profile from settings when none exist", async () => {
    await ensureIncomeProfilesFromSettings(prisma, userId)
    expect(prisma.incomeProfile.create).toHaveBeenCalled()
  })

  it("skips backfill when profiles exist", async () => {
    ensureModel(prisma, "incomeProfile").count!.mockResolvedValue(1)
    vi.mocked(prisma.incomeProfile.create!).mockClear()
    await ensureIncomeProfilesFromSettings(prisma, userId)
    expect(prisma.incomeProfile.create).not.toHaveBeenCalled()
  })

  it("creates profile using next position from aggregate", async () => {
    ensureModel(prisma, "incomeProfile").aggregate!.mockResolvedValue({ _max: { position: 3 } })
    await createIncomeProfile(prisma, userId, {
      label: "Next",
      effectiveFrom: "2025-01-01",
      effectiveTo: "2025-12-31",
      crSalaryGross: 1,
    })
    expect(prisma.incomeProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ position: 4 }) }),
    )
  })

  it("creates serialized profile with optional fields", async () => {
    const created = await createIncomeProfile(prisma, userId, {
      label: "2025 raise",
      effectiveFrom: "2025-01-01",
      effectiveTo: "2025-12-31",
      crSalaryGross: 920000,
      crSalaryCurrency: "USD",
      crPayPeriod: "BIWEEKLY",
    })
    expect(created.crPayPeriod).toBe("BIWEEKLY")
  })

  it("rejects overlapping and invalid profiles", async () => {
    ensureModel(prisma, "incomeProfile").findMany!.mockResolvedValue([
      {
        id: "open",
        label: "Current",
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
    await expect(
      createIncomeProfile(prisma, userId, {
        label: "New open",
        effectiveFrom: "2025-01-01",
        crSalaryGross: 900000,
      }),
    ).rejects.toBeInstanceOf(IncomeProfileValidationError)

    await expect(
      createIncomeProfile(prisma, userId, {
        label: "Bad",
        effectiveFrom: "2025-06-01",
        effectiveTo: "2025-01-01",
        crSalaryGross: 1,
      }),
    ).rejects.toMatchObject({ message: "End date must be on or after start date" })
  })

  it("lists serialized profiles", async () => {
    ensureModel(prisma, "incomeProfile").findMany!.mockResolvedValue([
      {
        id: "p1",
        label: "Salary",
        effectiveFrom: new Date("2024-01-01"),
        effectiveTo: null,
        crSalaryGross: "850000",
        crSalaryCurrency: "CRC",
        crPayPeriod: "MONTHLY",
        crSolidaristaPct: "0",
        crPensionComplementariaPct: "0",
        crEsppPct: "0",
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
    const rows = await listSerializedIncomeProfiles(prisma, userId)
    expect(rows[0]!.effectiveFrom).toBe("2024-01-01")
  })
})
