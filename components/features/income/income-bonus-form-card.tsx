"use client"

import { SelectField } from "@/components/select-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CURRENCY_OPTIONS } from "@/components/features/income/income-bonus-types"
import type { useIncomeBonuses } from "@/components/features/income/use-income-bonuses"

type BonusFormState = Pick<
  ReturnType<typeof useIncomeBonuses>,
  | "name"
  | "setName"
  | "gross"
  | "setGross"
  | "currency"
  | "setCurrency"
  | "paidOn"
  | "setPaidOn"
  | "repeatsAnnually"
  | "setRepeatsAnnually"
  | "createMut"
>

export function IncomeBonusFormCard({
  name,
  setName,
  gross,
  setGross,
  currency,
  setCurrency,
  paidOn,
  setPaidOn,
  repeatsAnnually,
  setRepeatsAnnually,
  createMut,
}: BonusFormState) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Add bonus</CardTitle>
        <CardDescription>
          Paid as salary: gross is added to that month&apos;s payroll. CCSS, renta, Solidarista,
          pension, and ESPP use the salary period active that month.
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
              placeholder="Aguinaldo"
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
          <div className="space-y-2">
            <Label htmlFor="bonusPaidOn">Payment date</Label>
            <Input
              id="bonusPaidOn"
              type="date"
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2 pb-0.5 sm:col-span-2">
            <input
              id="bonusRepeats"
              type="checkbox"
              className="border-input size-4 rounded border"
              checked={repeatsAnnually}
              onChange={(e) => setRepeatsAnnually(e.target.checked)}
            />
            <Label htmlFor="bonusRepeats" className="cursor-pointer text-sm font-normal">
              Same month every year (e.g. aguinaldo every December)
            </Label>
          </div>
        </div>

        <Button
          type="button"
          disabled={
            createMut.isPending || !name.trim() || !gross || Number(gross) <= 0 || !paidOn
          }
          onClick={() => createMut.mutate()}
        >
          Add bonus
        </Button>
      </CardContent>
    </Card>
  )
}
