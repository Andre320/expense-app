import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  createRsuPlan,
  deleteRsuPlan,
  getRsuPlanDetail,
  listRsuPlanSummaries,
  listRsuVests,
  receiveRsuVest,
  undoRsuVestReceive,
  updateRsuPlan,
} from "@/lib/rsu/services/plan.service"
import { createMockPrisma, ensureModel } from "@/lib/test/fixtures/prisma-mock"

vi.mock("@/lib/stocks/services/quote.service", () => ({
  getStockQuote: vi.fn(),
}))

import { getStockQuote } from "@/lib/stocks/services/quote.service"

describe("plan.service", () => {
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

    ensureModel(prisma, "rsuPlan").findMany!.mockResolvedValue([planRow])
    ensureModel(prisma, "rsuPlan").findFirst!.mockResolvedValue(planRow)
    ensureModel(prisma, "rsuPlan").aggregate!.mockResolvedValue({ _max: { position: 0 } })
    ensureModel(prisma, "rsuPlan").create!.mockResolvedValue({ ...planRow, id: "plan-new" })
    ensureModel(prisma, "rsuPlan").update!.mockResolvedValue(planRow)
    ensureModel(prisma, "rsuPlan").delete!.mockResolvedValue(planRow)
    ensureModel(prisma, "rsuVest").create!.mockResolvedValue(planRow.vests[0])
    ensureModel(prisma, "rsuVest").findMany!.mockResolvedValue(planRow.vests)
    ensureModel(prisma, "rsuVest").findFirstOrThrow!.mockResolvedValue(planRow.vests[0])
    ensureModel(prisma, "rsuVest").update!.mockResolvedValue({
      ...planRow.vests[0],
      status: "RECEIVED",
    })
  })

  it("lists plan summaries with quote", async () => {
    const rows = await listRsuPlanSummaries(prisma, userId)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.plan.ticker).toBe("SNOW")
    expect(rows[0]!.quote.available).toBe(true)
  })

  it("returns plan detail", async () => {
    const detail = await getRsuPlanDetail(prisma, userId, "plan-1")
    expect(detail.plan.name).toBe("2024 Grant")
    expect(detail.vests).toHaveLength(1)
  })

  it("creates plan with vest schedule", async () => {
    ensureModel(prisma, "rsuPlan").findFirst!.mockResolvedValue({ ...planRow, id: "plan-new" })
    const detail = await createRsuPlan(prisma, userId, {
      name: "New Grant",
      ticker: "snow",
      totalShares: 1000,
      grantDate: "2024-01-15T00:00:00.000Z",
    })
    expect(detail.plan.ticker).toBe("SNOW")
    expect(prisma.rsuVest.create).toHaveBeenCalled()
  })

  it("updates owned plan", async () => {
    const detail = await updateRsuPlan(prisma, userId, "plan-1", { name: "Renamed" })
    expect(detail.plan.name).toBe("2024 Grant")
  })

  it("deletes owned plan", async () => {
    await deleteRsuPlan(prisma, userId, "plan-1")
    expect(prisma.rsuPlan.delete).toHaveBeenCalledWith({ where: { id: "plan-1" } })
  })

  it("throws when plan is not found", async () => {
    ensureModel(prisma, "rsuPlan").findFirst!.mockResolvedValue(null)
    await expect(getRsuPlanDetail(prisma, userId, "missing")).rejects.toThrow("Not found")
  })

  it("lists vests for owned plan", async () => {
    const vests = await listRsuVests(prisma, userId, "plan-1")
    expect(vests).toHaveLength(1)
    expect(vests[0]!.sequence).toBe(1)
  })

  it("marks vest received with quote", async () => {
    ensureModel(prisma, "rsuPlan").findFirst!.mockResolvedValue(planRow)
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
    vi.mocked(getStockQuote).mockResolvedValue({
      available: true,
      ticker: "SNOW",
      priceUsd: 150,
      asOf: now.toISOString(),
    })
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

  it("throws when updating missing plan", async () => {
    ensureModel(prisma, "rsuPlan").findFirst!.mockResolvedValue(null)
    await expect(updateRsuPlan(prisma, userId, "missing", { name: "X" })).rejects.toThrow(
      "Not found",
    )
  })

  it("rejects invalid grant date on create", async () => {
    await expect(
      createRsuPlan(prisma, userId, {
        name: "Bad",
        ticker: "SNOW",
        totalShares: 100,
        grantDate: "not-a-date",
      }),
    ).rejects.toThrow("Invalid grantDate")
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

  it("lists summaries with unavailable quote", async () => {
    vi.mocked(getStockQuote).mockResolvedValue({
      available: false,
      ticker: "SNOW",
      error: "offline",
    })
    const rows = await listRsuPlanSummaries(prisma, userId)
    expect(rows[0]!.valuation).toBeNull()
  })
})
