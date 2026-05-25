import * as React from "react"
import { cn } from "@/lib/shared/utils"

export function InsetPanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("border-border bg-muted/30 rounded-lg border p-3", className)} {...props} />
  )
}
