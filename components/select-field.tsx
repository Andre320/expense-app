"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/shared/utils"

export const SELECT_NONE = "__none__"

type SelectFieldProps = {
  label?: string
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
  triggerClassName?: string
  size?: "sm" | "default"
  id?: string
}

export function SelectField({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  className,
  triggerClassName,
  size = "default",
  id,
}: SelectFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Select value={value || SELECT_NONE} onValueChange={onValueChange}>
        <SelectTrigger id={id} size={size} className={cn("w-full", triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value || SELECT_NONE} value={opt.value || SELECT_NONE}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
