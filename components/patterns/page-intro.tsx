import * as React from "react"
import { cn } from "@/lib/utils"

type Props = {
  eyebrow?: string
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  /** When true, skip the wide-screen row layout (title + actions side by side). */
  stacked?: boolean
  className?: string
}

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  stacked,
  className,
}: Props) {
  return (
    <header
      className={cn(
        stacked
          ? "flex flex-col gap-1"
          : "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <div className="max-w-2xl text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  )
}
