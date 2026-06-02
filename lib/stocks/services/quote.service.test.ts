import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getStockQuote, priceFromAlpacaSnapshot } from "@/lib/stocks/services/quote.service"

describe("priceFromAlpacaSnapshot", () => {
  it("prefers latest trade price", () => {
    const result = priceFromAlpacaSnapshot({
      latestTrade: { p: 172.55, t: "2022-08-17T10:19:30.735811394Z" },
      dailyBar: { c: 173.03, t: "2022-08-16T04:00:00Z" },
    })
    expect(result).toEqual({
      priceUsd: 172.55,
      asOf: "2022-08-17T10:19:30.735811394Z",
    })
  })

  it("falls back to daily close when no trade", () => {
    const result = priceFromAlpacaSnapshot({
      dailyBar: { c: 173.03, t: "2022-08-16T04:00:00Z" },
      prevDailyBar: { c: 173.19, t: "2022-08-15T04:00:00Z" },
    })
    expect(result).toEqual({
      priceUsd: 173.03,
      asOf: "2022-08-16T04:00:00Z",
    })
  })

  it("falls back to previous daily close", () => {
    const result = priceFromAlpacaSnapshot({
      prevDailyBar: { c: 173.19, t: "2022-08-15T04:00:00Z" },
    })
    expect(result).toEqual({
      priceUsd: 173.19,
      asOf: "2022-08-15T04:00:00Z",
    })
  })

  it("uses bid/ask midpoint as last resort", () => {
    const result = priceFromAlpacaSnapshot({
      latestQuote: { bp: 100, ap: 102, t: "2022-08-17T10:19:30.805564086Z" },
    })
    expect(result).toEqual({
      priceUsd: 101,
      asOf: "2022-08-17T10:19:30.805564086Z",
    })
  })

  it("returns null when no usable price", () => {
    expect(priceFromAlpacaSnapshot({})).toBeNull()
  })

  it("skips zero trade price and falls back to daily bar", () => {
    const result = priceFromAlpacaSnapshot({
      latestTrade: { p: 0, t: "2026-01-01T00:00:00Z" },
      dailyBar: { c: 10.5, t: "2026-01-02T00:00:00Z" },
    })
    expect(result).toEqual({ priceUsd: 10.5, asOf: "2026-01-02T00:00:00Z" })
  })

  it("synthesizes asOf when trade timestamp missing", () => {
    const result = priceFromAlpacaSnapshot({ latestTrade: { p: 42 } })
    expect(result!.priceUsd).toBe(42)
    expect(result!.asOf).toMatch(/^\d{4}-/)
  })

  it("returns null for invalid bid/ask", () => {
    expect(priceFromAlpacaSnapshot({ latestQuote: { bp: 0, ap: 100 } })).toBeNull()
    expect(priceFromAlpacaSnapshot({ latestQuote: { ap: 100 } })).toBeNull()
  })
})

describe("getStockQuote", () => {
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
    const result = await getStockQuote("  ")
    expect(result.available).toBe(false)
    expect(result.error).toBe("Invalid ticker")
  })

  it("returns error when alpaca keys are missing", async () => {
    delete process.env.ALPACA_API_KEY_ID
    delete process.env.ALPACA_API_SECRET_KEY
    const result = await getStockQuote("SNOW")
    expect(result.available).toBe(false)
    expect(result.error).toContain("ALPACA_API_KEY_ID")
  })

  it("appends feed query param when ALPACA_DATA_FEED is set", async () => {
    process.env.ALPACA_DATA_FEED = "sip"
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ latestTrade: { p: 1, t: "2026-01-01T00:00:00Z" } }),
    })
    await getStockQuote("FEED")
    const url = String(fetchMock.mock.calls[0]![0])
    expect(url).toContain("feed=sip")
    delete process.env.ALPACA_DATA_FEED
  })

  it("returns quote on successful fetch", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        latestTrade: { p: 150.25, t: "2026-05-01T12:00:00Z" },
      }),
    })

    const result = await getStockQuote("snow")
    expect(result).toMatchObject({
      available: true,
      ticker: "SNOW",
      priceUsd: 150.25,
      source: "alpaca",
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it("uses cache on second request for same ticker", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        dailyBar: { c: 99.5, t: "2026-05-01T12:00:00Z" },
      }),
    })

    const first = await getStockQuote("CACHE1")
    const second = await getStockQuote("CACHE1")
    expect(first.available).toBe(true)
    expect(second.available).toBe(true)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it("returns error when Alpaca responds with non-OK status", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429 })

    const result = await getStockQuote("FAIL429")
    expect(result.available).toBe(false)
    expect(result.error).toBe("Alpaca returned 429")
  })

  it("returns error when snapshot has no price", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })

    const result = await getStockQuote("EMPTY")
    expect(result.available).toBe(false)
    expect(result.error).toBe("No quote available for ticker")
  })

  it("refetches after cache entry expires", async () => {
    const now = 1_700_000_000_000
    vi.spyOn(Date, "now").mockReturnValue(now)
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        latestTrade: { p: 10, t: "2026-01-01T00:00:00Z" },
      }),
    })

    await getStockQuote("EXPIRE")
    vi.spyOn(Date, "now").mockReturnValue(now + 6 * 60 * 1000)
    await getStockQuote("EXPIRE")
    expect(fetchMock).toHaveBeenCalledTimes(2)
    vi.restoreAllMocks()
  })

  it("returns error when fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("network down"))

    const result = await getStockQuote("THROW")
    expect(result.available).toBe(false)
    expect(result.error).toBe("network down")
  })

  it("returns generic message when fetch throws non-Error", async () => {
    fetchMock.mockRejectedValue("offline")
    const result = await getStockQuote("THROW2")
    expect(result.error).toBe("Quote fetch failed")
  })
})
