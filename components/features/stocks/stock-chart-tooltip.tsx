import { formatMoneyBase } from "@/lib/shared/format-money"
import type { ForecastChartPoint } from "@/lib/stocks/forecast"
import type { StockRange } from "@/lib/stocks/range"

type SimpleChartPoint = { date: string; close: number }

export function formatAxisLabel(date: string, range: StockRange): string {
  const d = new Date(date)
  if (range === "day" || range === "week") {
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function StockChartTooltip({
  active,
  payload,
  label,
  range,
  simpleView,
}: {
  active?: boolean
  payload?: { payload: ForecastChartPoint | SimpleChartPoint }[]
  label?: string
  range: StockRange
  simpleView?: boolean
}) {
  if (!active || !payload?.length || label == null) return null

  const point = payload[0]!.payload
  const close = point.close
  if (close == null) return null

  const rows: { label: string; value: number; color: string; extra?: string }[] = [
    { label: "Close", value: close, color: "#38bdf8" },
  ]

  if (!simpleView && "central" in point) {
    if (point.central != null) {
      rows.push({ label: "Base (Holt)", value: point.central, color: "#a78bfa" })
    }
    if (point.lower68 != null && point.upper68 != null) {
      rows.push({
        label: "68% band",
        value: point.lower68,
        color: "#c4b5fd",
        extra: formatMoneyBase(point.upper68, "USD"),
      })
    }
  }

  return (
    <div className="border-border bg-popover rounded-lg border px-3 py-2.5 text-xs shadow-lg">
      <p className="text-popover-foreground mb-2 font-semibold">
        {formatAxisLabel(String(label), range)}
      </p>
      <ul className="space-y-1">
        {rows.map((row, i) => (
          <li
            key={`${row.label}-${i}`}
            className="flex items-center justify-between gap-4 tabular-nums"
          >
            <span className="text-popover-foreground flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              {row.label}
            </span>
            <span className="text-foreground font-medium">
              {formatMoneyBase(row.value, "USD")}
              {row.extra ? ` – ${row.extra}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
