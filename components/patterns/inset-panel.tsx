import * as React from "react"
import { cn } from "@/lib/utils"

export function InsetPanel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/30 p-3",
        className,
      )}
      {...props}
    />
  )
}
