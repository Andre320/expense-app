import * as React from "react"
import { cn } from "@/lib/shared/utils"

export type EmptyStateProps = {
  message: React.ReactNode
  className?: string
}

export function EmptyState({ message, className }: EmptyStateProps) {
  return <p className={cn("text-muted-foreground text-sm", className)}>{message}</p>
}
