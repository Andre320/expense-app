"use client"

import Link from "next/link"
import * as React from "react"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error("[app error boundary]", error)
  }, [error])

  return (
    <div className="mx-auto max-w-lg space-y-4 py-16">
      <h2 className="text-lg font-semibold tracking-tight">Something went wrong</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        This page hit an unexpected error. Try reloading the view, or go back to the dashboard if
        the problem continues.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/">Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
