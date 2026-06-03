"use client"

import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/select-field"
import { formatMoneyBase } from "@/lib/shared/format-money"
import { VoluntaryDeductionsFields } from "./planner-form.parts"
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
          Track promotions and past salaries. Each period has its own gross and payroll deduction
          percentages; CCSS and renta follow Costa Rica rules for that salary.
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
              {p.sorted.map((row) => {
                const isEditing = p.editingId === row.id
                return (
                  <li key={row.id} className="space-y-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{row.label}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatPeriodRange(row.effectiveFrom, row.effectiveTo)}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                          {formatMoneyBase(row.crSalaryGross, row.crSalaryCurrency)} gross ·{" "}
                          {row.crPayPeriod === "BIWEEKLY" ? "biweekly" : "monthly"}
                        </p>
                        {!isEditing ? (
                          <p className="text-muted-foreground text-xs">
                            Solidarista {row.crSolidaristaPct}% · Pensión{" "}
                            {row.crPensionComplementariaPct}% · ESPP {row.crEsppPct}%
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!isEditing ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => p.startEditingDeductions(row)}
                          >
                            Edit deductions
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={p.deleteMut.isPending}
                          onClick={() => p.deleteMut.mutate(row.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="space-y-3">
                        <VoluntaryDeductionsFields
                          solidaristaPct={p.editSolidaristaPct}
                          onSolidaristaPctChange={p.setEditSolidaristaPct}
                          pensionPct={p.editPensionPct}
                          onPensionPctChange={p.setEditPensionPct}
                          esppPct={p.editEsppPct}
                          onEsppPctChange={p.setEditEsppPct}
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            disabled={p.updateDeductionsMut.isPending}
                            onClick={() => p.updateDeductionsMut.mutate(row.id)}
                          >
                            {p.updateDeductionsMut.isPending ? "Saving…" : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={p.updateDeductionsMut.isPending}
                            onClick={p.cancelEditingDeductions}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-[11px]">
        New periods copy deduction % from the salary calculator below. Use{" "}
        <span className="font-medium">Edit deductions</span> on a past period when Solidarista,
        pension, or ESPP differed that year. The calculator only updates your current ongoing
        salary.
      </p>
    </div>
  )
}
