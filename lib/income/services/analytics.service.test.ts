import { beforeEach, describe, expect, it } from "vitest"
import { getAnalyticsSummary } from "@/lib/income/services/analytics.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

describe("analytics.service", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"

  beforeEach(() => {
    ensureModel(prisma, "appSettings").findUniqueOrThrow!.mockResolvedValue({
      id: "s1",
      userId,
      crSalaryGross: "1500000",
      crSalaryCurrency: "CRC",
      crPayPeriod: "MONTHLY",
      crCrcPerUsd: "500",
      crSolidaristaPct: "0",
      crPensionComplementariaPct: "0",
      crEsppPct: "0",
    })
    ensureModel(prisma, "incomeBonus").findMany!.mockResolvedValue([])
    ensureModel(prisma, "transaction").findMany!.mockImplementation(({ where }) => {
      if (where?.occurredAt) {
        return Promise.resolve([
          {
            occurredAt: new Date(),
            kind: "EXPENSE",
            amountBase: "300000",
          },
          {
            occurredAt: new Date(),
            kind: "INCOME",
            amountBase: "1500000",
          },
        ])
      }
      return Promise.resolve([
        { kind: "INCOME", amountBase: "1500000" },
        { kind: "EXPENSE", amountBase: "300000" },
      ])
    })
    ensureModel(prisma, "savingsGoal").findMany!.mockResolvedValue([
      { currentAmount: "100000", currency: "CRC" },
    ])
    ensureModel(prisma, "savingsAccount").findMany!.mockResolvedValue([
      { balance: "200", currency: "USD" },
    ])
  })

  it("returns analytics summary with monthly buckets", async () => {
    const result = await getAnalyticsSummary(prisma, userId)

    expect(result.monthly).toHaveLength(12)
    expect(result.reportingCurrency).toBe("CRC")
    expect(result.hasSalaryProfile).toBe(true)
    expect(result.savingsTotal).toBe(100000)
    expect(result.savingsAccountsTotal).toBe(100000)
    expect(result.ledgerNetBalance).toBe(1200000)
    expect(result.settings.crCrcPerUsd).toBe(500)
  })

  it("reports no salary profile when gross is zero", async () => {
    ensureModel(prisma, "appSettings").findUniqueOrThrow!.mockResolvedValue({
      id: "s1",
      userId,
      crSalaryGross: "0",
      crSalaryCurrency: "CRC",
      crPayPeriod: "MONTHLY",
      crCrcPerUsd: "500",
      crSolidaristaPct: "0",
      crPensionComplementariaPct: "0",
      crEsppPct: "0",
    })

    const result = await getAnalyticsSummary(prisma, userId)
    expect(result.hasSalaryProfile).toBe(false)
  })

  it("reports active bonuses for the current calendar month", async () => {
    const month = new Date().getMonth() + 1
    ensureModel(prisma, "incomeBonus").findMany!.mockResolvedValue([
      {
        name: "Holiday",
        grossAmount: "100000",
        grossCurrency: "CRC",
        months: `[${month}]`,
      },
    ])
    const result = await getAnalyticsSummary(prisma, userId)
    expect(result.bonusGrossThisMonth).toBe(100_000)
    expect(result.activeBonusesThisMonth[0]!.name).toBe("Holiday")
  })

  it("ignores transactions outside the rolling 12-month window", async () => {
    ensureModel(prisma, "transaction").findMany!.mockImplementation(({ where }) => {
      if (where?.occurredAt) {
        return Promise.resolve([
          {
            occurredAt: new Date("1990-01-01T00:00:00.000Z"),
            kind: "EXPENSE",
            amountBase: "999999",
          },
        ])
      }
      return Promise.resolve([])
    })

    const result = await getAnalyticsSummary(prisma, userId)
    expect(result.monthly.every((m) => m.expense === 0)).toBe(true)
  })
})
