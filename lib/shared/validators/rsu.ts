import { z } from "zod"

export const rsuPlanCreateZ = z.object({
  name: z.string().min(1).max(128),
  ticker: z.string().min(1).max(16),
  totalShares: z.number().positive(),
  grantDate: z.string().min(1),
  vestingPeriodMonths: z.number().int().positive().optional(),
  vestIntervalMonths: z.number().int().positive().optional(),
  vestDayOfMonth: z.number().int().min(1).max(31).optional(),
  taxWithholdPct: z.number().min(0).max(100).optional(),
  notes: z.string().max(512).optional(),
  position: z.number().int().min(0).optional(),
})

export const rsuPlanUpdateZ = rsuPlanCreateZ
  .omit({ grantDate: true, totalShares: true, ticker: true })
  .partial()
  .extend({
    taxWithholdPct: z.number().min(0).max(100).optional(),
    notes: z.string().max(512).nullable().optional(),
  })

export const rsuVestReceiveZ = z.object({
  receivedAt: z.string().optional(),
})
