"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"
import { fetchStockHistory } from "@/components/features/stocks/stock-price-chart"
import { projectVestScenarios } from "@/lib/rsu/projection"
import { priceScenarioAtDate } from "@/lib/stocks/forecast"

export type RsuPlanListItem = {
  plan: {
    id: string
    name: string
    ticker: string
    totalShares: number
    taxWithholdPct: number
    grantDate: string
    vestingPeriodMonths: number
    vestIntervalMonths: number
    vestDayOfMonth: number
  }
  summary: {
    sharesReceived: number
    sharesRemaining: number
    pctComplete: number
    nextVestDate: string | null
    installmentsReceived: number
    installmentsTotal: number
  }
  quote: {
    available: boolean
    priceUsd?: number
    error?: string
  }
  valuation: {
    receivedGrossUsd: number
    receivedNetUsd: number
    receivedCashBonusUsd: number
    pendingGrossUsd: number
    totalGrantGrossUsd: number
  } | null
}

export type RsuPlanDetail = RsuPlanListItem & {
  vests: {
    id: string
    sequence: number
    scheduledDate: string
    shares: number
    status: "PENDING" | "RECEIVED"
    receivedAt: string | null
    sharesWithheld: number | null
    netShares: number | null
    cashBonusUsd: number | null
  }[]
}

export type CreateRsuPlanInput = {
  name: string
  ticker: string
  totalShares: number
  grantDate: string
  vestingPeriodMonths: number
  vestIntervalMonths: number
  vestDayOfMonth: number
  taxWithholdPct: number
}

export const RSU_PLANS_QUERY_KEY = ["rsu-plans"] as const

export function rsuPlanDetailQueryKey(planId: string) {
  return ["rsu-plans", planId] as const
}

export async function fetchPlans(): Promise<RsuPlanListItem[]> {
  const res = await fetch("/api/rsu-plans")
  if (!res.ok) throw new Error("plans")
  return res.json()
}

export async function fetchPlanDetail(id: string): Promise<RsuPlanDetail> {
  const res = await fetch(`/api/rsu-plans/${id}`)
  if (!res.ok) throw new Error("plan")
  return res.json()
}

export function useRsuPlansQuery() {
  return useQuery({
    queryKey: RSU_PLANS_QUERY_KEY,
    queryFn: fetchPlans,
  })
}

export function useRsuPlanDetailQuery(planId: string, enabled: boolean) {
  return useQuery({
    queryKey: rsuPlanDetailQueryKey(planId),
    queryFn: () => fetchPlanDetail(planId),
    enabled,
  })
}

export function useCreateRsuPlanMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateRsuPlanInput) => {
      const res = await fetch("/api/rsu-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error("fail")
      return res.json()
    },
    onSuccess: () => {
      toast.success("RSU plan created")
      qc.invalidateQueries({ queryKey: RSU_PLANS_QUERY_KEY })
    },
    onError: () => toast.error("Could not create plan"),
  })
}

export function useDeleteRsuPlanMutation(planId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/rsu-plans/${planId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("fail")
    },
    onSuccess: () => {
      toast.success("Plan removed")
      qc.invalidateQueries({ queryKey: RSU_PLANS_QUERY_KEY })
    },
    onError: () => toast.error("Delete failed"),
  })
}

export function useReceiveVestMutation(planId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vestId: string) => {
      const res = await fetch(`/api/rsu-plans/${planId}/vests/${vestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? "fail")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Vest marked received")
      qc.invalidateQueries({ queryKey: RSU_PLANS_QUERY_KEY })
      qc.invalidateQueries({ queryKey: rsuPlanDetailQueryKey(planId) })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUndoVestMutation(planId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vestId: string) => {
      const res = await fetch(`/api/rsu-plans/${planId}/vests/${vestId}`, {
        method: "PATCH",
      })
      if (!res.ok) throw new Error("fail")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Vest reset to pending")
      qc.invalidateQueries({ queryKey: RSU_PLANS_QUERY_KEY })
      qc.invalidateQueries({ queryKey: rsuPlanDetailQueryKey(planId) })
    },
    onError: () => toast.error("Could not undo"),
  })
}

export function useNextVestForecast(
  item: RsuPlanListItem,
  chartTicker: string,
  showForecast: boolean,
) {
  const { plan, summary } = item
  const symbol = plan.ticker.trim().toUpperCase()
  const chartSymbol = chartTicker.trim().toUpperCase()
  const showVestForecast = showForecast && symbol === chartSymbol && summary.nextVestDate != null

  const { data: history } = useQuery({
    queryKey: ["stock-history", symbol, "month"],
    queryFn: () => fetchStockHistory(symbol, "month"),
    enabled: showVestForecast,
  })

  const { data: vestDetail } = useRsuPlanDetailQuery(item.plan.id, showVestForecast)

  const nextPendingVest = React.useMemo(() => {
    if (!vestDetail?.vests) return null
    return (
      vestDetail.vests.find(
        (v) =>
          v.status === "PENDING" &&
          summary.nextVestDate &&
          v.scheduledDate.slice(0, 10) === summary.nextVestDate.slice(0, 10),
      ) ?? vestDetail.vests.find((v) => v.status === "PENDING")
    )
  }, [vestDetail, summary.nextVestDate])

  const vestProjection = React.useMemo(() => {
    const forecast = history?.forecast
    if (!forecast || !nextPendingVest || !summary.nextVestDate) return null
    const vestDate = new Date(summary.nextVestDate)
    const bear = priceScenarioAtDate(forecast, vestDate, "bear")
    const base = priceScenarioAtDate(forecast, vestDate, "base")
    const bull = priceScenarioAtDate(forecast, vestDate, "bull")
    if (bear == null || base == null || bull == null) return null
    return projectVestScenarios(nextPendingVest.shares, plan.taxWithholdPct, {
      bear,
      base,
      bull,
    })
  }, [history?.forecast, nextPendingVest, summary.nextVestDate, plan.taxWithholdPct])

  return {
    showVestForecast,
    history,
    nextPendingVest,
    vestProjection,
  }
}
