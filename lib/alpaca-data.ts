import "server-only"

export const ALPACA_DATA_BASE = "https://data.alpaca.markets"

export function alpacaDataHeaders(): Record<string, string> | null {
  const keyId = process.env.ALPACA_API_KEY_ID
  const secretKey = process.env.ALPACA_API_SECRET_KEY
  if (!keyId || !secretKey) return null
  return {
    "APCA-API-KEY-ID": keyId,
    "APCA-API-SECRET-KEY": secretKey,
  }
}

export function appendAlpacaFeedParam(params: URLSearchParams): void {
  const feed = process.env.ALPACA_DATA_FEED?.trim()
  if (feed) params.set("feed", feed)
}
