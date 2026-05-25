import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getStockHistory } from "@/lib/stocks/services/history.service"

function risingBars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    t: `2026-01-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
    c: 100 + i,
  }))
}

describe("getStockHistory", () => {
  const prevKey = process.env.ALPACA_API_KEY_ID
  const prevSecret = process.env.ALPACA_API_SECRET_KEY
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    process.env.ALPACA_API_KEY_ID = "test-key"
    process.env.ALPACA_API_SECRET_KEY = "test-secret"
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (prevKey) process.env.ALPACA_API_KEY_ID = prevKey
    else delete process.env.ALPACA_API_KEY_ID
    if (prevSecret) process.env.ALPACA_API_SECRET_KEY = prevSecret
    else delete process.env.ALPACA_API_SECRET_KEY
  })

  it("returns error for empty ticker", async () => {
    const result = await getStockHistory("  ")
    expect(result.available).toBe(false)
    expect(result.error).toBe("Invalid ticker")
  })

  it("returns error when alpaca keys are missing", async () => {
    delete process.env.ALPACA_API_KEY_ID
    delete process.env.ALPACA_API_SECRET_KEY

    const result = await getStockHistory("SNOW")
    expect(result.available).toBe(false)
    expect(result.error).toContain("ALPACA_API_KEY_ID")
  })

  it("returns bars and forecast on success", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ bars: risingBars(20) }),
    })

    const result = await getStockHistory("snow", "month")
    expect(result.available).toBe(true)
    expect(result.ticker).toBe("SNOW")
    expect(result.range).toBe("month")
    expect(result.bars).toHaveLength(20)
    expect(result.forecast).not.toBeNull()
  })

  it("returns error when Alpaca responds with non-OK status", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 })

    const result = await getStockHistory("SNOW")
    expect(result.available).toBe(false)
    expect(result.error).toBe("Alpaca returned 500")
  })

  it("returns error when no bars returned", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ bars: [] }) })

    const result = await getStockHistory("SNOW")
    expect(result.available).toBe(false)
    expect(result.error).toBe("No historical bars for ticker")
  })

  it("returns error when fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("timeout"))

    const result = await getStockHistory("SNOW")
    expect(result.available).toBe(false)
    expect(result.error).toBe("timeout")
  })

  it("returns generic error when fetch throws non-Error", async () => {
    fetchMock.mockRejectedValue("network down")

    const result = await getStockHistory("SNOW")
    expect(result.available).toBe(false)
    expect(result.error).toBe("History fetch failed")
  })

  it("accepts StockRange object directly", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ bars: risingBars(20) }),
    })

    const result = await getStockHistory("SNOW", "week")
    expect(result.range).toBe("week")
  })

  it("returns null forecast when too few bars for model", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ bars: risingBars(2) }),
    })

    const result = await getStockHistory("SNOW")
    expect(result.available).toBe(true)
    expect(result.forecast).toBeNull()
  })
})
