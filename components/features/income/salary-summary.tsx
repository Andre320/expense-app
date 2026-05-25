"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { rechartsTooltipContentStyle } from "@/lib/stocks/chart-style"
import { fmtCrc } from "./use-income-planner"

const PIE_COLORS: Record<string, string> = {
  net: "var(--chart-income)",
  ccss: "#a78bfa",
  renta: "#f97316",
  solidarista: "#38bdf8",
  pension: "#c084fc",
  espp: "#94a3b8",
}

const PIE_LEGEND_DOT_CLASS: Record<string, string> = {
  net: "bg-[color:var(--chart-income)]",
  ccss: "bg-[#a78bfa]",
  renta: "bg-[#f97316]",
  solidarista: "bg-[#38bdf8]",
  pension: "bg-[#c084fc]",
  espp: "bg-[#94a3b8]",
}

type SalarySummaryProps = {
  pieData: { name: string; value: number; key: string }[]
  grossMonthlyCrc: number
}

export function SalarySummary({ pieData, grossMonthlyCrc }: SalarySummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Where the money goes</CardTitle>
        <CardDescription>
          Monthly view in CRC — gross {fmtCrc(grossMonthlyCrc)} before deductions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mx-auto h-[280px] w-full max-w-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={100}
                paddingAngle={2}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={PIE_COLORS[entry.key] ?? "#71717a"}
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => fmtCrc(typeof v === "number" ? v : Number(v))}
                contentStyle={rechartsTooltipContentStyle}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="text-muted-foreground mt-4 space-y-2 text-xs">
          {pieData.map((p) => (
            <li key={p.key} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span
                  className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${PIE_LEGEND_DOT_CLASS[p.key] ?? "bg-[#71717a]"}`}
                />
                {p.name}
              </span>
              <span className="text-foreground tabular-nums">{fmtCrc(p.value)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
