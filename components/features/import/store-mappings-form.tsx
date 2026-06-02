"use client"

import { SELECT_NONE, SelectField } from "@/components/select-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  pattern: string
  displayName: string
  categoryId: string
  categoryOptions: { value: string; label: string }[]
  isPending: boolean
  onPatternChange: (v: string) => void
  onDisplayNameChange: (v: string) => void
  onCategoryChange: (v: string) => void
  onSubmit: () => void
}

export function StoreMappingsForm({
  pattern,
  displayName,
  categoryId,
  categoryOptions,
  isPending,
  onPatternChange,
  onDisplayNameChange,
  onCategoryChange,
  onSubmit,
}: Props) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
      <div className="space-y-2 lg:min-w-[140px]">
        <Label htmlFor="pattern">Pattern</Label>
        <Input
          id="pattern"
          placeholder="MXM"
          value={pattern}
          onChange={(e) => onPatternChange(e.target.value)}
        />
      </div>
      <div className="space-y-2 lg:min-w-[200px]">
        <Label htmlFor="displayName">Clean name</Label>
        <Input
          id="displayName"
          placeholder="Walmart / MXM"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
        />
      </div>
      <SelectField
        id="cat"
        label="Category"
        value={categoryId}
        onValueChange={(v) => onCategoryChange(v === SELECT_NONE ? "" : v)}
        options={categoryOptions}
        className="lg:min-w-[200px]"
      />
      <Button
        type="button"
        disabled={!pattern.trim() || !displayName.trim() || !categoryId || isPending}
        onClick={onSubmit}
      >
        Add mapping
      </Button>
    </div>
  )
}
