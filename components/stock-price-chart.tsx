"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoneyBase } from "@/lib/format-money";
import { rechartsTooltipContentStyle } from "@/lib/chart-style";

type HistoryResponse = {
  available: boolean;
  ticker: string;
  bars?: { date: string; close: number }[];
  error?: string;
};

async function fetchHistory(ticker: string, days: number): Promise<HistoryResponse> {
  const res = await fetch(`/api/stocks/history/${encodeURIComponent(ticker)}?days=${days}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as HistoryResponse;
    throw new Error(body.error ?? "Could not load price history");
  }
  return res.json();
}

function formatAxisDate(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function StockPriceChart({
  ticker = "SNOW",
  days = 90,
}: {
  ticker?: string;
  days?: number;
}) {
  const symbol = ticker.trim().toUpperCase();
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["stock-history", symbol, days],
    queryFn: () => fetchHistory(symbol, days),
  });

  const bars = data?.bars ?? [];
  const latest = bars.at(-1)?.close;
  const first = bars[0]?.close;
  const changePct =
    latest != null && first != null && first > 0
      ? ((latest - first) / first) * 100
      : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{symbol} price</CardTitle>
        <CardDescription className="tabular-nums">
          {isPending
            ? "Loading daily closes from Alpaca…"
            : latest != null
              ? `${formatMoneyBase(latest, "USD")} latest close`
              : "Daily closing prices"}
          {changePct != null ? (
            <span className={changePct >= 0 ? " text-emerald-400" : " text-red-400"}>
              {" "}
              · {changePct >= 0 ? "+" : ""}
              {changePct.toFixed(1)}% over {days}d
            </span>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[260px] min-h-[260px] pt-2">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading chart…</p>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            {(error as Error).message ?? "Chart unavailable"}
          </p>
        ) : bars.length === 0 ? (
          <p className="text-sm text-muted-foreground">No price data.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <LineChart data={bars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#71717a"
                tick={{ fontSize: 11 }}
                tickFormatter={formatAxisDate}
                minTickGap={24}
              />
              <YAxis
                stroke="#71717a"
                tick={{ fontSize: 11 }}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `$${v}`}
                width={52}
              />
              <Tooltip
                contentStyle={rechartsTooltipContentStyle}
                labelFormatter={(label) => formatAxisDate(String(label))}
                formatter={(value) => [formatMoneyBase(Number(value), "USD"), "Close"]}
              />
              <Line
                type="monotone"
                dataKey="close"
                name="Close"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
