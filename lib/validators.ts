import { z } from "zod"

export const transactionKindZ = z.enum(["INCOME", "EXPENSE"])

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

export const crPayPeriodZ = z.enum(["MONTHLY", "BIWEEKLY"])
export const crSalaryCurrencyZ = z.enum(["CRC", "USD"])

export const settingsPatchZ = z.object({
  crSalaryGross: z.number().nonnegative().optional(),
  crSalaryCurrency: crSalaryCurrencyZ.optional(),
  crPayPeriod: crPayPeriodZ.optional(),
  crCrcPerUsd: z.number().positive().optional(),
  crSolidaristaPct: z.number().min(0).max(100).optional(),
  crPensionComplementariaPct: z.number().min(0).max(100).optional(),
  crEsppPct: z.number().min(0).max(100).optional(),
})

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

export const knownStoreCreateZ = z.object({
  pattern: z.string().min(1).max(128),
  displayName: z.string().min(1).max(256),
  categoryId: z.string().min(1),
})

export const knownStoreUpdateZ = knownStoreCreateZ.partial()

export const categoryCreateZ = z.object({
  name: z.string().min(1).max(128),
  kind: transactionKindZ,
  color: z.string().max(32).optional(),
})

export const categoryUpdateZ = categoryCreateZ.partial()

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
