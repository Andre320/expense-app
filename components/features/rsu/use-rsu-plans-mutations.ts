"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { parseApiError } from "@/lib/shared/api-error"
import {
  type CreateRsuPlanInput,
  RSU_PLANS_QUERY_KEY,
  rsuPlanDetailQueryKey,
} from "./use-rsu-plans-queries"

export function useCreateRsuPlanMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateRsuPlanInput) => {
      const res = await fetch("/api/rsu-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw await parseApiError(res)
      return res.json()
    },
    onSuccess: () => {
      toast.success("RSU plan created")
      qc.invalidateQueries({ queryKey: RSU_PLANS_QUERY_KEY })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteRsuPlanMutation(planId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/rsu-plans/${planId}`, { method: "DELETE" })
      if (!res.ok) throw await parseApiError(res)
    },
    onSuccess: () => {
      toast.success("Plan removed")
      qc.invalidateQueries({ queryKey: RSU_PLANS_QUERY_KEY })
    },
    onError: (e: Error) => toast.error(e.message),
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
      if (!res.ok) throw await parseApiError(res)
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
      if (!res.ok) throw await parseApiError(res)
      return res.json()
    },
    onSuccess: () => {
      toast.success("Vest reset to pending")
      qc.invalidateQueries({ queryKey: RSU_PLANS_QUERY_KEY })
      qc.invalidateQueries({ queryKey: rsuPlanDetailQueryKey(planId) })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
