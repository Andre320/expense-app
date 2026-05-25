"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { SelectField } from "@/components/select-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { bonusGrossToMonthlyCrc } from "@/lib/income/bonus"

export type IncomeBonusDto = {
  id: string
  name: string
  grossAmount: number
  grossCurrency: string
  months: number[]
  position: number
}

const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const

const CURRENCY_OPTIONS = [
  { value: "CRC", label: "CRC" },
  { value: "USD", label: "USD" },
] as const

async function fetchBonuses(): Promise<IncomeBonusDto[]> {
  const res = await fetch("/api/income-bonuses")
  if (!res.ok) throw new Error("bonuses")
  return res.json()
}

function formatGross(b: IncomeBonusDto, crcPerUsd: number) {
  if (b.grossCurrency === "USD") {
    const crc = bonusGrossToMonthlyCrc(b, crcPerUsd)
    return `$${b.grossAmount.toLocaleString()} (≈ ₡${Math.round(crc).toLocaleString()})`
  }
  return `₡${b.grossAmount.toLocaleString()}`
}

type IncomeBonusesManagerProps = {
  crcPerUsd?: number
  embedded?: boolean
}

export function IncomeBonusesManager({ crcPerUsd = 505, embedded }: IncomeBonusesManagerProps) {
  const qc = useQueryClient()
  const { data, isPending } = useQuery({
    queryKey: ["income-bonuses"],
    queryFn: fetchBonuses,
  })

  const [name, setName] = React.useState("")
  const [gross, setGross] = React.useState("")
  const [currency, setCurrency] = React.useState<"CRC" | "USD">("CRC")
  const [selectedMonths, setSelectedMonths] = React.useState<number[]>([])

  function toggleMonth(m: number) {
    setSelectedMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b),
    )
  }

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/income-bonuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          grossAmount: Number(gross),
          grossCurrency: currency,
          months: selectedMonths,
        }),
      })
      if (!res.ok) throw new Error("fail")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Bonus added")
      setName("")
      setGross("")
      setCurrency("CRC")
      setSelectedMonths([])
      qc.invalidateQueries({ queryKey: ["income-bonuses"] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
    },
    onError: () => toast.error("Could not add bonus"),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/income-bonuses/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("fail")
    },
    onSuccess: () => {
      toast.success("Bonus removed")
      qc.invalidateQueries({ queryKey: ["income-bonuses"] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
    },
    onError: () => toast.error("Delete failed"),
  })

  const sorted = React.useMemo(
    () => [...(data ?? [])].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name)),
    [data],
  )

  return (
    <div className="space-y-6">
      {!embedded ? (
        <header>
          <h2 className="text-lg font-semibold tracking-tight">Fixed bonuses</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Gross amounts applied in selected months each year. Taxed together with salary that
            month.
          </p>
        </header>
      ) : null}

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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Saved bonuses</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : sorted.length === 0 ? (
            <p className="text-muted-foreground text-sm">No bonuses yet.</p>
          ) : (
            <ul className="space-y-3">
              {sorted.map((b) => (
                <li
                  key={b.id}
                  className="border-border flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-muted-foreground text-sm tabular-nums">
                      {formatGross(b, crcPerUsd)} gross
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {b.months.map((m) => (
                        <Badge key={m} variant="default" className="text-[10px]">
                          {MONTH_LABELS[m - 1]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => deleteMut.mutate(b.id)}
                    disabled={deleteMut.isPending}
                    aria-label={`Delete ${b.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export { MONTH_LABELS }
