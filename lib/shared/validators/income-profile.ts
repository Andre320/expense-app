import { z } from "zod"
import { crPayPeriodZ, crSalaryCurrencyZ } from "./common"

const isoDateZ = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .or(z.string().datetime())

const salaryFieldsZ = {
  crSalaryGross: z.number().nonnegative(),
  crSalaryCurrency: crSalaryCurrencyZ.optional(),
  crPayPeriod: crPayPeriodZ.optional(),
  crSolidaristaPct: z.number().min(0).max(100).optional(),
  crPensionComplementariaPct: z.number().min(0).max(100).optional(),
  crEsppPct: z.number().min(0).max(100).optional(),
}

export const incomeProfileCreateZ = z.object({
  label: z.string().min(1).max(128),
  effectiveFrom: isoDateZ,
  effectiveTo: isoDateZ.nullable().optional(),
  position: z.number().int().min(0).optional(),
  ...salaryFieldsZ,
})

export const incomeProfileUpdateZ = incomeProfileCreateZ.partial()
