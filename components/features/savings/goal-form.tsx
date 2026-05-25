"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { UseMutationResult } from "@tanstack/react-query"

type GoalFormProps = {
  name: string
  onNameChange: (value: string) => void
  target: string
  onTargetChange: (value: string) => void
  alreadySaved: string
  onAlreadySavedChange: (value: string) => void
  priority: string
  onPriorityChange: (value: string) => void
  goalCurrency: "CRC" | "USD"
  onGoalCurrencyChange: (value: "CRC" | "USD") => void
  createMut: UseMutationResult<unknown, Error, void, unknown>
}

export function GoalForm({
  name,
  onNameChange,
  target,
  onTargetChange,
  alreadySaved,
  onAlreadySavedChange,
  priority,
  onPriorityChange,
  goalCurrency,
  onGoalCurrencyChange,
  createMut,
}: GoalFormProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">New goal</CardTitle>
        <CardDescription>
          Set a target and how much you&apos;ve already saved toward it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="sg-name">Name</Label>
          <Input id="sg-name" value={name} onChange={(e) => onNameChange(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Currency</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={goalCurrency}
            onValueChange={(v) => {
              if (v === "CRC" || v === "USD") onGoalCurrencyChange(v)
            }}
          >
            <ToggleGroupItem value="CRC" aria-label="CRC">
              CRC
            </ToggleGroupItem>
            <ToggleGroupItem value="USD" aria-label="USD">
              USD
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sg-target">Target ({goalCurrency})</Label>
          <Input
            id="sg-target"
            type="number"
            value={target}
            onChange={(e) => onTargetChange(e.target.value)}
            placeholder="optional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sg-saved">Already saved ({goalCurrency})</Label>
          <Input
            id="sg-saved"
            type="number"
            value={alreadySaved}
            onChange={(e) => onAlreadySavedChange(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sg-pri">Priority</Label>
          <Input
            id="sg-pri"
            type="number"
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
            placeholder="auto"
          />
        </div>

        <Button
          type="button"
          disabled={!name.trim() || createMut.isPending}
          onClick={() => createMut.mutate()}
        >
          Add goal
        </Button>
      </CardContent>
    </Card>
  )
}
