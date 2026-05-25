"use client"

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { ForecastChartPoint } from "@/lib/stocks/forecast"
import type { StockRange } from "@/lib/stocks/range"
import { formatAxisLabel, StockChartTooltip } from "./stock-chart-tooltip"

type SimpleChartPoint = { date: string; close: number }

type StockChartCanvasProps = {
  simpleView: boolean
  range: StockRange
  simpleChartPoints: SimpleChartPoint[]
  forecastPoints: ForecastChartPoint[]
}

export function StockChartCanvas({
  simpleView,
  range,
  simpleChartPoints,
  forecastPoints,
}: StockChartCanvasProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
      {simpleView ? (
        <LineChart data={simpleChartPoints} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#71717a"
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => formatAxisLabel(String(v), range)}
            minTickGap={28}
          />
          <YAxis
            stroke="#71717a"
            tick={{ fontSize: 11 }}
            domain={["auto", "auto"]}
            tickFormatter={(v) => `$${v}`}
            width={52}
          />
          <Tooltip
            content={<StockChartTooltip range={range} simpleView />}
            cursor={{ stroke: "#52525b", strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="close"
            name="close"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      ) : (
        <ComposedChart data={forecastPoints} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#71717a"
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => formatAxisLabel(String(v), range)}
            minTickGap={28}
          />
          <YAxis
            stroke="#71717a"
            tick={{ fontSize: 11 }}
            domain={["auto", "auto"]}
            tickFormatter={(v) => `$${v}`}
            width={52}
          />
          <Tooltip
            content={<StockChartTooltip range={range} />}
            cursor={{ stroke: "#52525b", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="upper95"
            stroke="#a78bfa33"
            strokeWidth={1}
            fill="transparent"
            dot={false}
            activeDot={false}
            connectNulls
            name="Upper 95%"
          />
          <Area
            type="monotone"
            dataKey="lower95"
            stroke="#a78bfa33"
            strokeWidth={1}
            fill="transparent"
            dot={false}
            activeDot={false}
            connectNulls
            name="Lower 95%"
          />
          <Area
            type="monotone"
            dataKey="upper68"
            stroke="#a78bfa66"
            strokeWidth={1}
            strokeDasharray="4 4"
            fill="#a78bfa22"
            dot={false}
            activeDot={false}
            connectNulls
            name="Upper 68%"
          />
          <Area
            type="monotone"
            dataKey="lower68"
            stroke="#a78bfa66"
            strokeWidth={1}
            strokeDasharray="4 4"
            fill="hsl(var(--card))"
            dot={false}
            activeDot={false}
            connectNulls
            name="Lower 68%"
          />
          <Line
            type="monotone"
            dataKey="close"
            name="close"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="central"
            name="central"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </ComposedChart>
      )}
    </ResponsiveContainer>
  )
}
