"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/shared/utils"

export type QueryErrorPanelProps = {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
  children?: React.ReactNode
}

export function QueryErrorPanel({
  title = "Could not load data",
  message,
  onRetry,
  className,
  children,
}: QueryErrorPanelProps) {
  return (
    <div
      role="alert"
      className={cn(
        "border-destructive/25 bg-destructive/5 space-y-2 rounded-lg border p-4",
        className,
      )}
    >
      <p className="text-destructive text-sm font-medium">{title}</p>
      <p className="text-muted-foreground text-sm">{message}</p>
      {children}
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" className="mt-1" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
