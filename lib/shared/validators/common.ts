import { z } from "zod"

export const transactionKindZ = z.enum(["INCOME", "EXPENSE"])
export const crPayPeriodZ = z.enum(["MONTHLY", "BIWEEKLY"])
export const crSalaryCurrencyZ = z.enum(["CRC", "USD"])

export const registerZ = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120).optional(),
})

export const loginZ = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
