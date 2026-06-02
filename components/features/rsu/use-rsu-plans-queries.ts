"use client"

import { useQuery } from "@tanstack/react-query"
import * as React from "react"
import { fetchStockHistory } from "@/components/features/stocks/stock-price-chart"
import { projectVestScenarios } from "@/lib/rsu/projection"
import { fetchJson } from "@/lib/shared/api-error"
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
  return fetchJson("/api/rsu-plans")
}

export async function fetchPlanDetail(id: string): Promise<RsuPlanDetail> {
  return fetchJson(`/api/rsu-plans/${id}`)
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
