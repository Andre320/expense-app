import type {
  Category,
  IncomeBonus,
  RsuPlan,
  RsuVest,
  SavingsAccount,
  SavingsAccountMovement,
  SavingsGoal,
  SavingsGoalMovement,
  Tag,
  Transaction,
} from "@/app/generated/prisma/client"
import { parseBonusMonths } from "@/lib/income/bonus"
import { numFromDecimal } from "@/lib/shared/decimal"

export function serializeTransaction(
  t: Transaction & {
    category?: Category | null
    tags?: { tag: Tag }[]
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
  }
}

export function serializeSettings(s: {
  id: string
  crSalaryGross: unknown
  crSalaryCurrency: string
  crPayPeriod: string
  crCrcPerUsd: unknown
  crSolidaristaPct: unknown
  crPensionComplementariaPct: unknown
  crEsppPct: unknown
  updatedAt: Date
}) {
  return {
    id: s.id,
    crSalaryGross: numFromDecimal(s.crSalaryGross),
    crSalaryCurrency: s.crSalaryCurrency,
    crPayPeriod: s.crPayPeriod,
    crCrcPerUsd: numFromDecimal(s.crCrcPerUsd),
    crSolidaristaPct: numFromDecimal(s.crSolidaristaPct),
    crPensionComplementariaPct: numFromDecimal(s.crPensionComplementariaPct),
    crEsppPct: numFromDecimal(s.crEsppPct),
    updatedAt: s.updatedAt.toISOString(),
  }
}

export function serializeSavings(g: SavingsGoal) {
  return {
    id: g.id,
    name: g.name,
    currency: g.currency || "CRC",
    targetAmount: g.targetAmount == null ? null : numFromDecimal(g.targetAmount),
    currentAmount: numFromDecimal(g.currentAmount),
    color: g.color,
    notes: g.notes,
    priorityOrder: g.priorityOrder,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  }
}

export function serializeIncomeBonus(b: IncomeBonus) {
  return {
    id: b.id,
    name: b.name,
    grossAmount: numFromDecimal(b.grossAmount),
    grossCurrency: b.grossCurrency,
    months: parseBonusMonths(b.months),
    position: b.position,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }
}

export function serializeSavingsAccount(a: SavingsAccount) {
  return {
    id: a.id,
    name: a.name,
    currency: a.currency || "CRC",
    balance: numFromDecimal(a.balance),
    notes: a.notes,
    position: a.position,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }
}

export function serializeSavingsAccountMovement(m: SavingsAccountMovement) {
  return {
    id: m.id,
    accountId: m.accountId,
    kind: m.kind,
    amount: numFromDecimal(m.amount),
    description: m.description,
    occurredAt: m.occurredAt.toISOString(),
    createdAt: m.createdAt.toISOString(),
  }
}

export function serializeSavingsGoalMovement(m: SavingsGoalMovement) {
  return {
    id: m.id,
    goalId: m.goalId,
    kind: m.kind,
    amount: numFromDecimal(m.amount),
    description: m.description,
    occurredAt: m.occurredAt.toISOString(),
    createdAt: m.createdAt.toISOString(),
  }
}

export function serializeRsuPlan(p: RsuPlan) {
  return {
    id: p.id,
    name: p.name,
    ticker: p.ticker,
    totalShares: numFromDecimal(p.totalShares),
    grantDate: p.grantDate.toISOString(),
    vestingPeriodMonths: p.vestingPeriodMonths,
    vestIntervalMonths: p.vestIntervalMonths,
    vestDayOfMonth: p.vestDayOfMonth,
    taxWithholdPct: numFromDecimal(p.taxWithholdPct),
    notes: p.notes,
    position: p.position,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}

export function serializeRsuVest(v: RsuVest) {
  return {
    id: v.id,
    planId: v.planId,
    sequence: v.sequence,
    scheduledDate: v.scheduledDate.toISOString(),
    shares: numFromDecimal(v.shares),
    status: v.status,
    receivedAt: v.receivedAt?.toISOString() ?? null,
    sharesWithheld: v.sharesWithheld != null ? numFromDecimal(v.sharesWithheld) : null,
    netShares: v.netShares != null ? numFromDecimal(v.netShares) : null,
    cashBonusUsd: v.cashBonusUsd != null ? numFromDecimal(v.cashBonusUsd) : null,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  }
}
