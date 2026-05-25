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
import { rechartsTooltipContentStyle } from "@/lib/stocks/chart-style"

type ChartPoint = {
  month: string
  income: number
  expense: number
  label: string
}

type DashboardMonthlyChartProps = {
  chartData: ChartPoint[]
  baseCurrency: string
}

export function DashboardMonthlyChart({ chartData, baseCurrency }: DashboardMonthlyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs expenses</CardTitle>
        <CardDescription>Monthly totals in {baseCurrency} — trailing twelve months</CardDescription>
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
            <Tooltip
              contentStyle={rechartsTooltipContentStyle}
              labelFormatter={(_, p) => {
                const pl = p?.[0]?.payload as { month?: string } | undefined
                return pl?.month ?? ""
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="income" name="Income" fill="var(--chart-income)" radius={[4, 4, 0, 0]} />
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
