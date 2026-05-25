import { z } from "zod"
import { crSalaryCurrencyZ } from "./common"

export const savingsCreateZ = z.object({
  name: z.string().min(1),
  currency: crSalaryCurrencyZ.optional(),
  targetAmount: z.number().nonnegative().nullable().optional(),
  currentAmount: z.number().nonnegative().optional(),
  priorityOrder: z.number().int().min(0).optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
})

export const savingsUpdateZ = savingsCreateZ.partial()

export const savingsMovementKindZ = z.enum(["DEPOSIT", "WITHDRAWAL", "ADJUSTMENT", "INITIAL"])

export const savingsMovementCreateZ = z.object({
  kind: savingsMovementKindZ,
  amount: z.number().positive(),
  description: z.string().max(256).optional().default(""),
  occurredAt: z.string().optional(),
})

export const savingsAccountCreateZ = z.object({
  name: z.string().min(1).max(128),
  currency: crSalaryCurrencyZ.optional(),
  balance: z.number().nonnegative().optional(),
  notes: z.string().max(512).optional(),
  position: z.number().int().min(0).optional(),
})

export const savingsAccountUpdateZ = savingsAccountCreateZ.partial()
