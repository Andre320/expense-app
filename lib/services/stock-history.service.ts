import "server-only";

import { subDays } from "date-fns";
import {
  ALPACA_DATA_BASE,
  alpacaDataHeaders,
  appendAlpacaFeedParam,
} from "@/lib/alpaca-data";

export type StockHistoryBar = {
  date: string;
  close: number;
};

export type StockHistoryResult = {
  available: boolean;
  ticker: string;
  bars?: StockHistoryBar[];
  error?: string;
};

type AlpacaBar = {
  t: string;
  c: number;
};

export async function getStockHistory(
  ticker: string,
  days = 90,
): Promise<StockHistoryResult> {
  const symbol = ticker.trim().toUpperCase();
  if (!symbol) {
    return { available: false, ticker: symbol, error: "Invalid ticker" };
  }

  const headers = alpacaDataHeaders();
  if (!headers) {
    return {
      available: false,
      ticker: symbol,
      error: "ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY are not configured",
    };
  }

  const safeDays = Math.min(365, Math.max(7, days));
  const start = subDays(new Date(), safeDays).toISOString();

  try {
    const params = new URLSearchParams({
      timeframe: "1Day",
      start,
      adjustment: "split",
      sort: "asc",
      limit: String(safeDays + 10),
    });
    appendAlpacaFeedParam(params);

    const url = `${ALPACA_DATA_BASE}/v2/stocks/${encodeURIComponent(symbol)}/bars?${params.toString()}`;
    const res = await fetch(url, {
      headers,
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return {
        available: false,
        ticker: symbol,
        error: `Alpaca returned ${res.status}`,
      };
    }

    const data = (await res.json()) as { bars?: AlpacaBar[] };
    const bars = (data.bars ?? []).map((bar) => ({
      date: bar.t.slice(0, 10),
      close: bar.c,
    }));

    if (bars.length === 0) {
      return {
        available: false,
        ticker: symbol,
        error: "No historical bars for ticker",
      };
    }

    return { available: true, ticker: symbol, bars };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "History fetch failed";
    return { available: false, ticker: symbol, error: msg };
  }
}
