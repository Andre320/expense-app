"use client"

import { SelectField } from "@/components/select-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CURRENCY_OPTIONS, MONTH_LABELS } from "@/components/features/income/income-bonus-types"
import type { useIncomeBonuses } from "@/components/features/income/use-income-bonuses"

type BonusFormState = Pick<
  ReturnType<typeof useIncomeBonuses>,
  | "name"
  | "setName"
  | "gross"
  | "setGross"
  | "currency"
  | "setCurrency"
  | "selectedMonths"
  | "toggleMonth"
  | "createMut"
>

export function IncomeBonusFormCard({
  name,
  setName,
  gross,
  setGross,
  currency,
  setCurrency,
  selectedMonths,
  toggleMonth,
  createMut,
}: BonusFormState) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Add bonus</CardTitle>
        <CardDescription>
          One entry per bonus type — pick the months it repeats (not one row per month).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bonusName">Name</Label>
            <Input
              id="bonusName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Productivity bonus"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bonusGross">Gross amount</Label>
            <Input
              id="bonusGross"
              type="number"
              min="1"
              value={gross}
              onChange={(e) => setGross(e.target.value)}
            />
          </div>
          <SelectField
            id="bonusCurrency"
            label="Currency"
            value={currency}
            onValueChange={(v) => setCurrency(v as "CRC" | "USD")}
            options={[...CURRENCY_OPTIONS]}
          />
        </div>

        <div className="space-y-2">
          <Label>Months (each year)</Label>
          <div className="flex flex-wrap gap-2">
            {MONTH_LABELS.map((label, i) => {
              const month = i + 1
              const on = selectedMonths.includes(month)
              return (
                <Button
                  key={month}
                  type="button"
                  size="sm"
                  variant={on ? "default" : "outline"}
                  onClick={() => toggleMonth(month)}
                >
                  {label}
                </Button>
              )
            })}
          </div>
        </div>

        <Button
          type="button"
          disabled={
            createMut.isPending ||
            !name.trim() ||
            !gross ||
            Number(gross) <= 0 ||
            selectedMonths.length === 0
          }
          onClick={() => createMut.mutate()}
        >
          Add bonus
        </Button>
      </CardContent>
    </Card>
  )
}
