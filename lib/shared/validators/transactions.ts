import { z } from "zod"
import { transactionKindZ } from "./common"

export const transactionCreateZ = z.object({
  occurredAt: z.string().min(1),
  kind: transactionKindZ,
  description: z.string().optional().default(""),
  categoryId: z.string().optional().nullable(),
  amountOriginal: z.number().positive(),
  currencyCode: z.string().min(3).max(3),
  tagIds: z.array(z.string()).optional(),
})

export const transactionUpdateZ = transactionCreateZ.partial().extend({
  amountOriginal: z.number().positive().optional(),
})

export const csvImportRowZ = z.object({
  occurredAt: z.string().min(1),
  kind: transactionKindZ,
  description: z.string().optional().default(""),
  amountOriginal: z.number().positive(),
  currencyCode: z.string().min(3).max(3),
  categoryName: z.string().optional(),
  categoryId: z.string().optional(),
})

export const csvImportZ = z.object({
  rows: z.array(csvImportRowZ).min(1).max(5000),
})
