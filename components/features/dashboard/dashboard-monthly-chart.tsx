import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoneyBase } from "@/lib/shared/format-money"

type ChartPoint = {
  month: string
  incomeLedger: number
  plannedIncome: number
  expense: number
  label: string
}

type DashboardMonthlyChartProps = {
  chartData: ChartPoint[]
  baseCurrency: string
  hasSalaryProfile?: boolean
}

type TooltipEntry = {
  dataKey?: string | number
  name?: string
  value?: number
  color?: string
  payload?: ChartPoint
}

function MonthlyBarTooltip({
  active,
  payload,
  baseCurrency,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  baseCurrency: string
}) {
  if (!active || !payload?.length) return null

  const row = payload[0]?.payload

  return (
    <div className="border-border bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-xs shadow-lg">
      <p className="mb-2 font-semibold">{row?.month ?? ""}</p>
      <ul className="space-y-1">
        {payload.map((entry: TooltipEntry) => (
          <li
            key={String(entry.dataKey)}
            className="flex items-center justify-between gap-4 tabular-nums"
          >
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="text-foreground font-medium">
              {formatMoneyBase(Number(entry.value), baseCurrency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DashboardMonthlyChart({
  chartData,
  baseCurrency,
  hasSalaryProfile,
}: DashboardMonthlyChartProps) {
  const hasPlanned = chartData.some((m) => m.plannedIncome > 0)
  const hasLedger = chartData.some((m) => m.incomeLedger > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs expenses</CardTitle>
        <CardDescription>
          Monthly totals in {baseCurrency} — trailing twelve months.{" "}
          {hasPlanned
            ? "Planned income uses your salary profiles by month."
            : hasSalaryProfile
              ? "Set gross salary on Income to show planned bars."
              : "Log INCOME transactions in Activity for ledger income bars."}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] min-h-[300px] pt-2">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="label" stroke="#71717a" tick={{ fontSize: 11 }} />
            <YAxis
              stroke="#71717a"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip content={<MonthlyBarTooltip baseCurrency={baseCurrency} />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {hasPlanned ? (
              <Bar
                dataKey="plannedIncome"
                name="Planned income"
                fill="var(--chart-planned-income)"
                radius={[4, 4, 0, 0]}
              />
            ) : null}
            {hasLedger ? (
              <Bar
                dataKey="incomeLedger"
                name="Ledger income"
                fill="var(--chart-income)"
                radius={[4, 4, 0, 0]}
              />
            ) : null}
            <Bar
              dataKey="expense"
              name="Expenses"
              fill="var(--chart-expense)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
