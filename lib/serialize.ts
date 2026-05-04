import type { Category, SavingsGoal, Tag, Transaction } from "@/app/generated/prisma/client";
import { numFromDecimal } from "./utils";

export function serializeTransaction(
  t: Transaction & {
    category?: Category | null;
    tags?: { tag: Tag }[];
  },
) {
  return {
    id: t.id,
    occurredAt: t.occurredAt.toISOString(),
    kind: t.kind,
    description: t.description,
    categoryId: t.categoryId,
    category: t.category
      ? { id: t.category.id, name: t.category.name, kind: t.category.kind }
      : null,
    amountOriginal: numFromDecimal(t.amountOriginal),
    currencyCode: t.currencyCode,
    rateToBase: numFromDecimal(t.rateToBase),
    amountBase: numFromDecimal(t.amountBase),
    rateToQuote: numFromDecimal(t.rateToQuote),
    amountQuote: numFromDecimal(t.amountQuote),
    tags: (t.tags ?? []).map((x) => ({
      id: x.tag.id,
      name: x.tag.name,
    })),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export function serializeSettings(s: {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  quotePerBase: unknown;
  currentBalanceBase: unknown;
  monthlyIncomeBase: unknown;
  monthlyDeductionsBase: unknown;
  crCrcPerUsd: unknown;
  crSolidaristaPct: unknown;
  crPensionComplementariaPct: unknown;
  crEsppPct: unknown;
  updatedAt: Date;
}) {
  return {
    id: s.id,
    baseCurrency: s.baseCurrency,
    quoteCurrency: s.quoteCurrency,
    quotePerBase: numFromDecimal(s.quotePerBase),
    currentBalanceBase: numFromDecimal(s.currentBalanceBase),
    monthlyIncomeBase: numFromDecimal(s.monthlyIncomeBase),
    monthlyDeductionsBase: numFromDecimal(s.monthlyDeductionsBase),
    crCrcPerUsd: numFromDecimal(s.crCrcPerUsd),
    crSolidaristaPct: numFromDecimal(s.crSolidaristaPct),
    crPensionComplementariaPct: numFromDecimal(s.crPensionComplementariaPct),
    crEsppPct: numFromDecimal(s.crEsppPct),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export function serializeSavings(g: SavingsGoal) {
  return {
    id: g.id,
    name: g.name,
    targetAmount: g.targetAmount == null ? null : numFromDecimal(g.targetAmount),
    currentAmount: numFromDecimal(g.currentAmount),
    color: g.color,
    notes: g.notes,
    priorityOrder: g.priorityOrder,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}
