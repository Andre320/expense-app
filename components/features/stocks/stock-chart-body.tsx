import { StockChartCanvas } from "@/components/features/stocks/stock-chart-canvas"
import { Skeleton } from "@/components/ui/skeleton"
import type { ForecastChartPoint } from "@/lib/stocks/forecast"
import type { StockRange } from "@/lib/stocks/range"

type SimpleChartPoint = { date: string; close: number }

type StockChartBodyProps = {
  isPending: boolean
  isError: boolean
  error: Error | null
  hasChartData: boolean
  simpleView: boolean
  range: StockRange
  simpleChartPoints: SimpleChartPoint[]
  forecastPoints: ForecastChartPoint[]
}

export function StockChartBody({
  isPending,
  isError,
  error,
  hasChartData,
  simpleView,
  range,
  simpleChartPoints,
  forecastPoints,
}: StockChartBodyProps) {
  if (isPending) return <Skeleton className="h-full w-full" />
  if (isError) {
    return <p className="text-muted-foreground text-sm">{error?.message ?? "Chart unavailable"}</p>
  }
  if (!hasChartData) {
    return <p className="text-muted-foreground text-sm">No price data.</p>
  }
  return (
    <StockChartCanvas
      simpleView={simpleView}
      range={range}
      simpleChartPoints={simpleChartPoints}
      forecastPoints={forecastPoints}
    />
  )
}
