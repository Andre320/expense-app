"use client"

import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateRsuPlanMutation } from "./use-rsu-plans"

type PlanFormProps = {
  embedded?: boolean
}

export function PlanForm({ embedded }: PlanFormProps) {
  const createMut = useCreateRsuPlanMutation()

  const [name, setName] = React.useState("")
  const [ticker, setTicker] = React.useState("")
  const [totalShares, setTotalShares] = React.useState("100")
  const [grantDate, setGrantDate] = React.useState("")
  const [vestingYears, setVestingYears] = React.useState("4")
  const [vestIntervalMonths, setVestIntervalMonths] = React.useState("3")
  const [vestDay, setVestDay] = React.useState("20")
  const [taxPct, setTaxPct] = React.useState("20")

  function handleSubmit() {
    createMut.mutate(
      {
        name: name.trim(),
        ticker: ticker.trim().toUpperCase(),
        totalShares: Number(totalShares),
        grantDate: grantDate || new Date().toISOString().slice(0, 10),
        vestingPeriodMonths: Number(vestingYears) * 12,
        vestIntervalMonths: Number(vestIntervalMonths),
        vestDayOfMonth: Number(vestDay),
        taxWithholdPct: Number(taxPct),
      },
      {
        onSuccess: () => {
          setName("")
          setTicker("")
        },
      },
    )
  }

  return (
    <Collapsible defaultOpen={!embedded} className="group/rsu-form">
      <Card className={embedded ? "border-0 bg-transparent shadow-none" : undefined}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">New RSU plan</CardTitle>
              <CardDescription>
                Fixed share grant with auto-generated vest schedule (e.g. quarterly on day 20).
              </CardDescription>
            </div>
            {embedded ? (
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-8 text-xs">
                  Add plan
                  <ChevronDown className="ml-1 h-3 w-3 group-data-[state=open]/rsu-form:hidden" />
                  <ChevronUp className="ml-1 hidden h-3 w-3 group-data-[state=open]/rsu-form:inline" />
                </Button>
              </CollapsibleTrigger>
            ) : null}
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="rsu-name">Name</Label>
              <Input id="rsu-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rsu-ticker">Ticker</Label>
              <Input
                id="rsu-ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="AAPL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rsu-shares">Total shares</Label>
              <Input
                id="rsu-shares"
                type="number"
                value={totalShares}
                onChange={(e) => setTotalShares(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rsu-grant">Grant date</Label>
              <Input
                id="rsu-grant"
                type="date"
                value={grantDate}
                onChange={(e) => setGrantDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rsu-years">Vesting (years)</Label>
              <Input
                id="rsu-years"
                type="number"
                value={vestingYears}
                onChange={(e) => setVestingYears(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rsu-interval">Interval (months)</Label>
              <Input
                id="rsu-interval"
                type="number"
                value={vestIntervalMonths}
                onChange={(e) => setVestIntervalMonths(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rsu-day">Vest day of month</Label>
              <Input
                id="rsu-day"
                type="number"
                value={vestDay}
                onChange={(e) => setVestDay(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rsu-tax">Tax withhold %</Label>
              <Input
                id="rsu-tax"
                type="number"
                value={taxPct}
                onChange={(e) => setTaxPct(e.target.value)}
              />
            </div>
            <Button
              type="button"
              disabled={!name.trim() || !ticker.trim() || createMut.isPending}
              onClick={handleSubmit}
            >
              Add plan
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
