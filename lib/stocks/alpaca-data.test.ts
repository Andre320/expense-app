import { afterEach, describe, expect, it } from "vitest"
import { alpacaDataHeaders, appendAlpacaFeedParam } from "@/lib/stocks/alpaca-data"

describe("alpacaDataHeaders", () => {
  const prevKey = process.env.ALPACA_API_KEY_ID
  const prevSecret = process.env.ALPACA_API_SECRET_KEY

  afterEach(() => {
    if (prevKey) process.env.ALPACA_API_KEY_ID = prevKey
    else delete process.env.ALPACA_API_KEY_ID
    if (prevSecret) process.env.ALPACA_API_SECRET_KEY = prevSecret
    else delete process.env.ALPACA_API_SECRET_KEY
  })

  it("returns null when keys are missing", () => {
    delete process.env.ALPACA_API_KEY_ID
    delete process.env.ALPACA_API_SECRET_KEY
    expect(alpacaDataHeaders()).toBeNull()
  })

  it("returns headers when keys are set", () => {
    process.env.ALPACA_API_KEY_ID = "key-id"
    process.env.ALPACA_API_SECRET_KEY = "secret"
    expect(alpacaDataHeaders()).toEqual({
      "APCA-API-KEY-ID": "key-id",
      "APCA-API-SECRET-KEY": "secret",
    })
  })
})

describe("appendAlpacaFeedParam", () => {
  const prevFeed = process.env.ALPACA_DATA_FEED

  afterEach(() => {
    if (prevFeed) process.env.ALPACA_DATA_FEED = prevFeed
    else delete process.env.ALPACA_DATA_FEED
  })

  it("sets feed param when env is configured", () => {
    process.env.ALPACA_DATA_FEED = " iex "
    const params = new URLSearchParams()
    appendAlpacaFeedParam(params)
    expect(params.get("feed")).toBe("iex")
  })

  it("leaves params empty when feed env is unset", () => {
    delete process.env.ALPACA_DATA_FEED
    const params = new URLSearchParams()
    appendAlpacaFeedParam(params)
    expect(params.size).toBe(0)
  })
})
