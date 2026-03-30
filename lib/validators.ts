import { z } from "zod";

export const transactionKindZ = z.enum(["INCOME", "EXPENSE"]);

export const transactionCreateZ = z.object({
  occurredAt: z.string().min(1),
  kind: transactionKindZ,
  description: z.string().optional().default(""),
  categoryId: z.string().optional().nullable(),
  amountOriginal: z.number().positive(),
  currencyCode: z.string().min(3).max(3),
  tagIds: z.array(z.string()).optional(),
});

export const transactionUpdateZ = transactionCreateZ.partial().extend({
  amountOriginal: z.number().positive().optional(),
});

export const settingsPatchZ = z.object({
  baseCurrency: z.string().min(3).max(3).optional(),
  quoteCurrency: z.string().min(3).max(3).optional(),
  quotePerBase: z.number().positive().optional(),
  currentBalanceBase: z.number().optional(),
  monthlyIncomeBase: z.number().optional(),
  monthlyDeductionsBase: z.number().optional(),
});

export const savingsCreateZ = z.object({
  name: z.string().min(1),
  targetBase: z.number().nonnegative().nullable().optional(),
  balanceBase: z.number().nonnegative().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
});

export const savingsUpdateZ = savingsCreateZ.partial();

export const csvImportRowZ = z.object({
  occurredAt: z.string().min(1),
  kind: transactionKindZ,
  description: z.string().optional().default(""),
  amountOriginal: z.number().positive(),
  currencyCode: z.string().min(3).max(3),
  categoryName: z.string().optional(),
});

export const csvImportZ = z.object({
  rows: z.array(csvImportRowZ).min(1).max(5000),
});
