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
  crCrcPerUsd: z.number().positive().optional(),
  crSolidaristaPct: z.number().min(0).max(100).optional(),
  crPensionComplementariaPct: z.number().min(0).max(100).optional(),
  crEsppPct: z.number().min(0).max(100).optional(),
});

export const savingsCreateZ = z.object({
  name: z.string().min(1),
  targetAmount: z.number().nonnegative().nullable().optional(),
  currentAmount: z.number().nonnegative().optional(),
  priorityOrder: z.number().int().min(0).optional(),
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
  categoryId: z.string().optional(),
});

export const csvImportZ = z.object({
  rows: z.array(csvImportRowZ).min(1).max(5000),
});

export const knownStoreCreateZ = z.object({
  pattern: z.string().min(1).max(128),
  displayName: z.string().min(1).max(256),
  categoryId: z.string().min(1),
});

export const knownStoreUpdateZ = knownStoreCreateZ.partial();

export const categoryCreateZ = z.object({
  name: z.string().min(1).max(128),
  kind: transactionKindZ,
  color: z.string().max(32).optional(),
});

export const categoryUpdateZ = categoryCreateZ.partial();
