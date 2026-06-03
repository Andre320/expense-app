"use client"

import { Button } from "@/components/ui/button"
import { formatMoneyBase } from "@/lib/shared/format-money"
import type { IncomeProfileDto } from "@/components/features/income/income-profile-types"
import { VoluntaryDeductionsFields } from "./planner-form.parts"
import type { useIncomeProfiles } from "./use-income-profiles"

function formatPeriodRange(from: string, to: string | null) {
  return to ? `${from} → ${to}` : `${from} → ongoing`
}

type ProfileListProps = Pick<
  ReturnType<typeof useIncomeProfiles>,
  | "sorted"
  | "editingId"
  | "editSolidaristaPct"
  | "setEditSolidaristaPct"
  | "editPensionPct"
  | "setEditPensionPct"
  | "editEsppPct"
  | "setEditEsppPct"
  | "startEditingDeductions"
  | "cancelEditingDeductions"
  | "updateDeductionsMut"
  | "deleteMut"
>

export function IncomeProfilePeriodList({
  sorted,
  editingId,
  editSolidaristaPct,
  setEditSolidaristaPct,
  editPensionPct,
  setEditPensionPct,
  editEsppPct,
  setEditEsppPct,
  startEditingDeductions,
  cancelEditingDeductions,
  updateDeductionsMut,
  deleteMut,
}: ProfileListProps) {
  return (
    <ul className="divide-border divide-y">
      {sorted.map((row: IncomeProfileDto) => {
        const isEditing = editingId === row.id
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
                    Solidarista {row.crSolidaristaPct}% · Pensión {row.crPensionComplementariaPct}%
                    · ESPP {row.crEsppPct}%
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => startEditingDeductions(row)}>
                    Edit deductions
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={deleteMut.isPending}
                  onClick={() => deleteMut.mutate(row.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <VoluntaryDeductionsFields
                  solidaristaPct={editSolidaristaPct}
                  onSolidaristaPctChange={setEditSolidaristaPct}
                  pensionPct={editPensionPct}
                  onPensionPctChange={setEditPensionPct}
                  esppPct={editEsppPct}
                  onEsppPctChange={setEditEsppPct}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={updateDeductionsMut.isPending}
                    onClick={() => updateDeductionsMut.mutate(row.id)}
                  >
                    {updateDeductionsMut.isPending ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateDeductionsMut.isPending}
                    onClick={cancelEditingDeductions}
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
  )
}
