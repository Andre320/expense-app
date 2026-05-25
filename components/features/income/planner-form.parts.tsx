import { Button } from "@/components/ui/button"

export function CurrencyToggle({
  currency,
  onCurrencyChange,
}: {
  currency: "CRC" | "USD"
  onCurrencyChange: (currency: "CRC" | "USD") => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant={currency === "CRC" ? "secondary" : "outline"}
        onClick={() => onCurrencyChange("CRC")}
      >
        CRC
      </Button>
      <Button
        type="button"
        size="sm"
        variant={currency === "USD" ? "secondary" : "outline"}
        onClick={() => onCurrencyChange("USD")}
      >
        USD
      </Button>
    </div>
  )
}

export function BreakdownRow({
  label,
  value,
  hint,
  strong,
}: {
  label: string
  value: string
  hint?: string
  strong?: boolean
}) {
  return (
    <div>
      <div className="flex justify-between gap-3">
        <span className={strong ? "text-foreground font-medium" : "text-muted-foreground"}>
          {label}
        </span>
        <span className={strong ? "text-foreground font-semibold" : ""}>{value}</span>
      </div>
      {hint ? <p className="text-muted-foreground mt-0.5 text-[11px]">{hint}</p> : null}
    </div>
  )
}
