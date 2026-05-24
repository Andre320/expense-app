"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { StockTickerOption } from "@/lib/stock-ticker-options"

type Props = {
  value: string
  onValueChange: (value: string) => void
  options: StockTickerOption[]
  id?: string
}

export function StockTickerSelect({ value, onValueChange, options, id = "stock-ticker" }: Props) {
  const rsu = options.filter((o) => o.group === "rsu")
  const preset = options.filter((o) => o.group === "preset" || o.group === "default")

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[10px] tracking-wider uppercase">
        Ticker
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} size="sm" className="h-8 w-[108px] uppercase tabular-nums">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {rsu.length > 0 ? (
            <SelectGroup>
              <SelectLabel>Your RSU plans</SelectLabel>
              {rsu.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="uppercase tabular-nums">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ) : null}
          <SelectGroup>
            <SelectLabel>{rsu.length > 0 ? "Presets" : "Tickers"}</SelectLabel>
            {preset.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="uppercase tabular-nums">
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
