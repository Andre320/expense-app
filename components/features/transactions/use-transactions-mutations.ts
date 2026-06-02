"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseFormReturn } from "react-hook-form"
import { toast } from "sonner"
import { parseApiError } from "@/lib/shared/api-error"
import type { FormValues } from "./use-transactions-queries"

export function useTransactionMutations(form: UseFormReturn<FormValues>) {
  const qc = useQueryClient()

  const createMut = useMutation({
    mutationFn: async (body: FormValues) => {
      const names = [
        ...new Set(
          (body.tagNames ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ]
      const tagIds: string[] = []
      for (const name of names) {
        const tr = await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        })
        if (!tr.ok) throw await parseApiError(tr)
        const tj = (await tr.json()) as { id: string }
        tagIds.push(tj.id)
      }
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occurredAt: body.occurredAt,
          kind: body.kind,
          description: body.description,
          categoryId: body.categoryId || null,
          amountOriginal: body.amountOriginal,
          currencyCode: body.currencyCode,
          tagIds,
        }),
      })
      if (!res.ok) throw await parseApiError(res)
      return res.json()
    },
    onSuccess: () => {
      toast.success("Entry saved")
      qc.invalidateQueries({ queryKey: ["transactions"] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
      qc.invalidateQueries({ queryKey: ["tags"] })
      form.reset({
        ...form.getValues(),
        description: "",
        amountOriginal: 1,
        tagNames: "",
      })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" })
      if (!res.ok) throw await parseApiError(res)
    },
    onSuccess: () => {
      toast.success("Removed")
      qc.invalidateQueries({ queryKey: ["transactions"] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return { createMut, deleteMut }
}
