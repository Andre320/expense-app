"use client"

import { ProgressBar } from "@/components/patterns/progress-bar"
import { formatMoneyBase } from "@/lib/shared/format-money"
import type { GoalMilestone } from "@/lib/planning/forecast-planning"

type Props = {
  milestones: GoalMilestone[]
  monthlySurplusBase: number
  baseCurrency: string
}

const fmt = formatMoneyBase

function monthsLabel(m: number | null): string {
  if (m == null) return "—"
  if (m === 0) return "Complete"
  if (!Number.isFinite(m)) return "—"
  return m === 1 ? "1 month" : `${m} months`
}

export function ForecastMilestones({ milestones, monthlySurplusBase, baseCurrency }: Props) {
  if (milestones.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Add savings goals with targets to see a funding timeline.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Funding timeline
        </p>
        <p className="text-muted-foreground text-xs">
          Surplus {fmt(monthlySurplusBase, baseCurrency)}/mo · sequential by priority
        </p>
      </div>
      <ol className="border-border relative space-y-6 border-l pl-6">
        {milestones.map((ms, i) => (
          <li key={ms.goalId} className="relative">
            <span className="border-border bg-card text-muted-foreground absolute top-1 -left-[25px] flex h-4 w-4 items-center justify-center rounded-full border text-[10px]">
              {i + 1}
            </span>
            <div className="border-border bg-muted/20 space-y-2 rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{ms.name}</p>
                  <p className="text-muted-foreground text-[11px]">
                    Priority {ms.priorityOrder}
                    {ms.gapToTarget != null
                      ? ` · ${fmt(ms.gapToTarget, baseCurrency)} to go`
                      : " · No target"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-foreground text-sm font-semibold tabular-nums">
                    {monthsLabel(ms.monthsForThisGoal)}
                  </p>
                  <p className="text-muted-foreground text-[10px]">to reach target</p>
                </div>
              </div>
              {ms.progressPct != null && (
                <div className="space-y-1">
                  <ProgressBar pct={ms.progressPct} />
                  <p className="text-muted-foreground text-[10px]">{ms.progressPct}% funded</p>
                </div>
              )}
              {ms.monthsFromNowWhenComplete != null &&
              ms.monthsForThisGoal != null &&
              ms.monthsForThisGoal > 0 ? (
                <p className="text-muted-foreground text-[11px]">
                  Fully funded by month {ms.monthsFromNowWhenComplete} from now (cumulative).
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
