"use client"

import { Trash2 } from "lucide-react"
import { EmptyState } from "@/components/patterns/empty-state"
import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatGross } from "@/components/features/income/format-bonus-gross"
import { MONTH_LABELS, type IncomeBonusDto } from "@/components/features/income/income-bonus-types"
import type { useIncomeBonuses } from "@/components/features/income/use-income-bonuses"

type BonusListProps = {
  sorted: IncomeBonusDto[]
  isPending: boolean
  isError?: boolean
  errorMessage?: string
  onRetry?: () => void
  crcPerUsd: number
  deleteMut: ReturnType<typeof useIncomeBonuses>["deleteMut"]
}

export function IncomeBonusListCard({
  sorted,
  isPending,
  isError,
  errorMessage,
  onRetry,
  crcPerUsd,
  deleteMut,
}: BonusListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Saved bonuses</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : isError ? (
          <QueryErrorPanel
            title="Could not load bonuses"
            message={errorMessage ?? "Bonuses are unavailable."}
            onRetry={onRetry}
          />
        ) : sorted.length === 0 ? (
          <EmptyState message="No bonuses yet." />
        ) : (
          <ul className="space-y-3">
            {sorted.map((b) => (
              <li
                key={b.id}
                className="border-border flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-muted-foreground text-sm tabular-nums">
                    {formatGross(b, crcPerUsd)} gross
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {b.months.map((m) => (
                      <Badge key={m} variant="default" className="text-[10px]">
                        {MONTH_LABELS[m - 1]}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => deleteMut.mutate(b.id)}
                  disabled={deleteMut.isPending}
                  aria-label={`Delete ${b.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
