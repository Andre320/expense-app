"use client";

import { ProgressBar } from "@/components/patterns/progress-bar";
import { formatMoneyBase } from "@/lib/format-money";
import type { GoalMilestone } from "@/lib/forecast-planning";

type Props = {
  milestones: GoalMilestone[];
  monthlySurplusBase: number;
  baseCurrency: string;
};

const fmt = formatMoneyBase;

function monthsLabel(m: number | null): string {
  if (m == null) return "—";
  if (m === 0) return "Complete";
  if (!Number.isFinite(m)) return "—";
  return m === 1 ? "1 month" : `${m} months`;
}

export function ForecastMilestones({
  milestones,
  monthlySurplusBase,
  baseCurrency,
}: Props) {
  if (milestones.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-fg)]">
        Add savings goals with targets to see a funding timeline.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-fg)]">
          Funding timeline
        </p>
        <p className="text-xs text-[var(--muted-fg)]">
          Surplus {fmt(monthlySurplusBase, baseCurrency)}/mo · sequential by priority
        </p>
      </div>
      <ol className="relative space-y-6 border-l border-[var(--border)] pl-6">
        {milestones.map((ms, i) => (
          <li key={ms.goalId} className="relative">
            <span className="absolute -left-[25px] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[10px] text-[var(--muted-fg)]">
              {i + 1}
            </span>
            <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{ms.name}</p>
                  <p className="text-[11px] text-[var(--muted-fg)]">
                    Priority {ms.priorityOrder}
                    {ms.gapToTarget != null
                      ? ` · ${fmt(ms.gapToTarget, baseCurrency)} to go`
                      : " · No target"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-[var(--foreground)]">
                    {monthsLabel(ms.monthsForThisGoal)}
                  </p>
                  <p className="text-[10px] text-[var(--muted-fg)]">to reach target</p>
                </div>
              </div>
              {ms.progressPct != null && (
                <div className="space-y-1">
                  <ProgressBar pct={ms.progressPct} />
                  <p className="text-[10px] text-[var(--muted-fg)]">{ms.progressPct}% funded</p>
                </div>
              )}
              {ms.monthsFromNowWhenComplete != null && ms.monthsForThisGoal != null && ms.monthsForThisGoal > 0 ? (
                <p className="text-[11px] text-[var(--muted-fg)]">
                  Fully funded by month {ms.monthsFromNowWhenComplete} from now (cumulative).
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
