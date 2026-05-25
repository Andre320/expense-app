import { cn } from "@/lib/shared/utils"

type Props = {
  /** 0–100 */
  pct: number
  className?: string
}

/**
 * Dynamic width uses one inline style (unavoidable for arbitrary %); styling otherwise Tailwind-only.
 */
export function ProgressBar({ pct, className }: Props) {
  const w = Math.min(100, Math.max(0, pct))
  return (
    <div className={cn("bg-muted h-2 overflow-hidden rounded-full", className)}>
      <div
        className="h-full rounded-full bg-emerald-500/80 transition-all duration-500"
        style={{ width: `${w}%` }}
      />
    </div>
  )
}
