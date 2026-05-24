import * as React from "react"
import { cn } from "@/lib/utils"

type Props = {
  label: string
  value: React.ReactNode
  className?: string
  valueClassName?: string
  labelClassName?: string
}

export function MetricStat({ label, value, className, valueClassName, labelClassName }: Props) {
  return (
    <div className={cn("space-y-1", className)}>
      <p
        className={cn(
          "text-muted-foreground text-[10px] font-medium tracking-wider uppercase",
          labelClassName,
        )}
      >
        {label}
      </p>
      <p className={cn("text-lg font-semibold tabular-nums", valueClassName)}>{value}</p>
    </div>
  )
}
