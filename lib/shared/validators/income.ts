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

const bonusMonthsZ = z
  .array(z.number().int().min(1).max(12))
  .min(1)
  .refine((months) => new Set(months).size === months.length, {
    message: "Duplicate months are not allowed",
  })

export const incomeBonusCreateZ = z.object({
  name: z.string().min(1).max(128),
  grossAmount: z.number().positive(),
  grossCurrency: crSalaryCurrencyZ.optional(),
  months: bonusMonthsZ,
  position: z.number().int().min(0).optional(),
})

export const incomeBonusUpdateZ = incomeBonusCreateZ.partial()
