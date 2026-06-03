"use client"

import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/select-field"
import { formatMoneyBase } from "@/lib/shared/format-money"
import { REPORTING_CURRENCY } from "@/lib/shared/app-currency"
import { useIncomeProfiles } from "./use-income-profiles"

function formatPeriodRange(from: string, to: string | null) {
  return to ? `${from} → ${to}` : `${from} → ongoing`
}

export function IncomeProfilesManager() {
  const p = useIncomeProfiles()

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold tracking-tight">Salary periods</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Track promotions and past salaries. Each period applies from its start date until the end
          date (or ongoing). Dashboard planned income uses the profile active for each month.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add period</CardTitle>
          <CardDescription>
            Close the current open-ended profile with an end date before adding a new ongoing one.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="profile-label">Label</Label>
            <Input
              id="profile-label"
              placeholder="e.g. 2025 promotion"
              value={p.label}
              onChange={(e) => p.setLabel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-from">Effective from</Label>
            <Input
              id="profile-from"
              type="date"
              value={p.effectiveFrom}
              onChange={(e) => p.setEffectiveFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-to">Effective to (optional)</Label>
            <Input
              id="profile-to"
              type="date"
              value={p.effectiveTo}
              onChange={(e) => p.setEffectiveTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-gross">Gross salary</Label>
            <Input
              id="profile-gross"
              inputMode="decimal"
              value={p.gross}
              onChange={(e) => p.setGross(e.target.value)}
            />
          </div>
          <SelectField
            label="Currency"
            value={p.currency}
            onValueChange={(v) => p.setCurrency(v as "CRC" | "USD")}
            options={[
              { value: "CRC", label: "CRC" },
              { value: "USD", label: "USD" },
            ]}
          />
          <SelectField
            label="Pay period"
            value={p.period}
            onValueChange={(v) => p.setPeriod(v as "MONTHLY" | "BIWEEKLY")}
            options={[
              { value: "MONTHLY", label: "Monthly" },
              { value: "BIWEEKLY", label: "Biweekly" },
            ]}
          />
          <div className="sm:col-span-2">
            <Button
              disabled={
                p.createMut.isPending ||
                !p.label.trim() ||
                !p.effectiveFrom ||
                !p.gross ||
                Number(p.gross) <= 0
              }
              onClick={() => p.createMut.mutate()}
            >
              {p.createMut.isPending ? "Saving…" : "Add profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your periods</CardTitle>
        </CardHeader>
        <CardContent>
          {p.isPending ? (
            <p className="text-muted-foreground text-sm">Loading profiles…</p>
          ) : p.isError ? (
            <QueryErrorPanel
              title="Could not load profiles"
              message={p.error?.message ?? "Unavailable"}
              onRetry={() => void p.refetch()}
            />
          ) : p.sorted.length === 0 ? (
            <p className="text-muted-foreground text-sm">No salary periods yet.</p>
          ) : (
            <ul className="divide-border divide-y">
              {p.sorted.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{row.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatPeriodRange(row.effectiveFrom, row.effectiveTo)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                      {formatMoneyBase(row.crSalaryGross, row.crSalaryCurrency)} gross ·{" "}
                      {row.crPayPeriod === "BIWEEKLY" ? "biweekly" : "monthly"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={p.deleteMut.isPending}
                    onClick={() => p.deleteMut.mutate(row.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-[11px]">
        Deductions for each period follow the values saved in the salary calculator below (current
        open profile). Amounts shown in {REPORTING_CURRENCY} on the dashboard use net estimates
        after tax rules.
      </p>
    </div>
  )
}
