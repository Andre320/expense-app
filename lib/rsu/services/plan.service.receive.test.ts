import { beforeEach, describe, expect, it, vi } from "vitest"
import { receiveRsuVest, undoRsuVestReceive } from "@/lib/rsu/services/plan.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

vi.mock("@/lib/stocks/services/quote.service", () => ({
  getStockQuote: vi.fn(),
}))

import { getStockQuote } from "@/lib/stocks/services/quote.service"

describe("plan.service receive", () => {
  const prisma = createMockPrisma()
  const userId = "user-1"
  const now = new Date("2024-01-15T00:00:00.000Z")

  const planRow = {
    id: "plan-1",
    userId,
    name: "2024 Grant",
    ticker: "SNOW",
    totalShares: "1000",
    grantDate: now,
    vestingPeriodMonths: 48,
    vestIntervalMonths: 3,
    vestDayOfMonth: 20,
    taxWithholdPct: "22",
    notes: null,
    position: 0,
    createdAt: now,
    updatedAt: now,
    vests: [
      {
        id: "vest-1",
        planId: "plan-1",
        sequence: 1,
        scheduledDate: new Date("2024-04-20T00:00:00.000Z"),
        shares: "250",
        status: "PENDING",
        receivedAt: null,
        sharesWithheld: null,
        netShares: null,
        cashBonusUsd: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
  }

  beforeEach(() => {
    vi.mocked(getStockQuote).mockResolvedValue({
      available: true,
      ticker: "SNOW",
      priceUsd: 150,
      asOf: now.toISOString(),
    })
    ensureModel(prisma, "rsuPlan").findFirst!.mockResolvedValue(planRow)
    ensureModel(prisma, "rsuVest").findFirstOrThrow!.mockResolvedValue(planRow.vests[0])
    ensureModel(prisma, "rsuVest").update!.mockResolvedValue({
      ...planRow.vests[0],
      status: "RECEIVED",
    })
  })

  it("marks vest received with quote", async () => {
    const detail = await receiveRsuVest(prisma, userId, "plan-1", "vest-1")
    expect(prisma.rsuVest.update).toHaveBeenCalled()
    expect(detail.plan.id).toBe("plan-1")
  })

  it("rejects receive when vest already received", async () => {
    ensureModel(prisma, "rsuVest").findFirstOrThrow!.mockResolvedValue({
      ...planRow.vests[0],
      status: "RECEIVED",
    })
    await expect(receiveRsuVest(prisma, userId, "plan-1", "vest-1")).rejects.toThrow(
      "Vest already received",
    )
  })

  it("rejects receive when quote unavailable", async () => {
    vi.mocked(getStockQuote).mockResolvedValue({
      available: false,
      ticker: "SNOW",
      error: "No quote",
    })
    await expect(receiveRsuVest(prisma, userId, "plan-1", "vest-1")).rejects.toThrow("No quote")
  })

  it("marks vest received with explicit receivedAt", async () => {
    await receiveRsuVest(prisma, userId, "plan-1", "vest-1", "2024-05-01T00:00:00.000Z")
    expect(prisma.rsuVest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "RECEIVED",
          receivedAt: new Date("2024-05-01T00:00:00.000Z"),
        }),
      }),
    )
  })

  it("rejects receive when quote has no price and no error message", async () => {
    vi.mocked(getStockQuote).mockResolvedValue({
      available: false,
      ticker: "SNOW",
    })
    await expect(receiveRsuVest(prisma, userId, "plan-1", "vest-1")).rejects.toThrow(
      "Stock quote required to mark vest received",
    )
  })

  it("undoes vest receive", async () => {
    ensureModel(prisma, "rsuVest").findFirstOrThrow!.mockResolvedValue({
      ...planRow.vests[0],
      status: "RECEIVED",
    })
    await undoRsuVestReceive(prisma, userId, "plan-1", "vest-1")
    expect(prisma.rsuVest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PENDING" }),
      }),
    )
  })

  it("rejects undo when vest is pending", async () => {
    await expect(undoRsuVestReceive(prisma, userId, "plan-1", "vest-1")).rejects.toThrow(
      "Vest is not received",
    )
  })

  it("stores cash bonus when fractional shares remain", async () => {
    ensureModel(prisma, "rsuVest").findFirstOrThrow!.mockResolvedValue({
      ...planRow.vests[0],
      shares: "10.5",
    })
    vi.mocked(getStockQuote).mockResolvedValue({
      available: true,
      ticker: "SNOW",
      priceUsd: 50,
      asOf: now.toISOString(),
    })
    await receiveRsuVest(prisma, userId, "plan-1", "vest-1")
    expect(prisma.rsuVest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cashBonusUsd: expect.any(String),
        }),
      }),
    )
  })

  it("rejects receive when quote price is zero", async () => {
    vi.mocked(getStockQuote).mockResolvedValue({
      available: true,
      ticker: "SNOW",
      priceUsd: 0,
      asOf: now.toISOString(),
    })
    await expect(receiveRsuVest(prisma, userId, "plan-1", "vest-1")).rejects.toThrow(
      "Stock quote required to mark vest received",
    )
  })

  it("omits cashBonusUsd when settlement has no fractional cash", async () => {
    await receiveRsuVest(prisma, userId, "plan-1", "vest-1")
    expect(prisma.rsuVest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ cashBonusUsd: null }),
      }),
    )
  })
})
