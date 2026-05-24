import { describe, expect, it } from "vitest"
import { priceFromAlpacaSnapshot } from "@/lib/services/stock-quote.service"

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
})
