"use client"

import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SELECT_NONE } from "@/components/select-field"
import { cn } from "@/lib/shared/utils"

type Option = { value: string; label: string }

type FormSelectProps<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  options: Option[]
  className?: string
  triggerClassName?: string
  disabled?: boolean
}

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "Select…",
  options,
  className,
  triggerClassName,
  disabled,
}: FormSelectProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <Select
            value={field.value === "" || field.value == null ? SELECT_NONE : field.value}
            onValueChange={(v) => field.onChange(v === SELECT_NONE ? "" : v)}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger className={cn("w-full", triggerClassName)}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem
                  key={opt.value || SELECT_NONE}
                  value={opt.value === "" ? SELECT_NONE : opt.value}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
