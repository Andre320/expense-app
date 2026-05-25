"use client"

import { InsetPanel } from "@/components/patterns/inset-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoneyBase } from "@/lib/shared/format-money"
import type { RsuPlanDetail } from "./use-rsu-plans"

type VestTableProps = {
  vests: RsuPlanDetail["vests"] | undefined
  isPending: boolean
  receivePending: boolean
  undoPending: boolean
  onReceive: (vestId: string) => void
  onUndo: (vestId: string) => void
}

export function VestTable({
  vests,
  isPending,
  receivePending,
  undoPending,
  onReceive,
  onUndo,
}: VestTableProps) {
  if (isPending) {
    return (
      <InsetPanel className="mt-2 p-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-4/5" />
        </div>
      </InsetPanel>
    )
  }

  if (!vests || vests.length === 0) {
    return (
      <InsetPanel className="mt-2 p-2">
        <p className="text-muted-foreground text-xs">No vest events.</p>
      </InsetPanel>
    )
  }

  return (
    <InsetPanel className="mt-2 p-2">
      <ul className="space-y-2 text-xs">
        {vests.map((v) => (
          <li
            key={v.id}
            className="border-border/50 flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
          >
            <div>
              <span className="font-medium">#{v.sequence}</span>{" "}
              {new Date(v.scheduledDate).toLocaleDateString()} · {v.shares} sh
              {v.status === "RECEIVED" && v.netShares != null
                ? ` → ${v.netShares} whole sh (${v.sharesWithheld} withheld${
                    v.cashBonusUsd != null && v.cashBonusUsd > 0
                      ? `, +${formatMoneyBase(v.cashBonusUsd, "USD")} cash`
                      : ""
                  })`
                : ""}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={v.status === "RECEIVED" ? "success" : "default"}>{v.status}</Badge>
              {v.status === "PENDING" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs"
                  disabled={receivePending}
                  onClick={() => onReceive(v.id)}
                >
                  Mark received
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={undoPending}
                  onClick={() => onUndo(v.id)}
                >
                  Undo
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </InsetPanel>
  )
}
