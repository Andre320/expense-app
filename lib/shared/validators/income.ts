import { z } from "zod"
import { crPayPeriodZ, crSalaryCurrencyZ } from "./common"

export const settingsPatchZ = z.object({
  crSalaryGross: z.number().nonnegative().optional(),
  crSalaryCurrency: crSalaryCurrencyZ.optional(),
  crPayPeriod: crPayPeriodZ.optional(),
  crCrcPerUsd: z.number().positive().optional(),
  crSolidaristaPct: z.number().min(0).max(100).optional(),
  crPensionComplementariaPct: z.number().min(0).max(100).optional(),
  crEsppPct: z.number().min(0).max(100).optional(),
})

const isoDateZ = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")

export const incomeBonusCreateZ = z.object({
  name: z.string().min(1).max(128),
  grossAmount: z.number().positive(),
  grossCurrency: crSalaryCurrencyZ.optional(),
  paidOn: isoDateZ,
  repeatsAnnually: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
})

export const incomeBonusUpdateZ = incomeBonusCreateZ.partial()
