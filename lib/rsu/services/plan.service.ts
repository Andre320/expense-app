import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import { buildVestSchedule, summarizePlan, settleVestReceive, valuePlan } from "@/lib/rsu/vesting"
import { serializeRsuPlan, serializeRsuVest } from "@/lib/shared/serialize"
import { getStockQuote } from "@/lib/stocks/services/quote.service"
import { numFromDecimal } from "@/lib/shared/utils"
import { type rsuPlanCreateZ } from "@/lib/shared/validators"
import type { z } from "zod"

type PlanCreate = z.infer<typeof rsuPlanCreateZ>

function parseGrantDate(value: string): Date {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) throw new Error("Invalid grantDate")
  return d
}

function vestSummaryInput(v: {
  sequence: number
  scheduledDate: Date
  shares: { toString(): string }
  status: string
  netShares: { toString(): string } | null
  cashBonusUsd: { toString(): string } | null
}) {
  return {
    sequence: v.sequence,
    scheduledDate: v.scheduledDate,
    shares: numFromDecimal(v.shares),
    status: v.status as "PENDING" | "RECEIVED",
    netShares: v.netShares != null ? numFromDecimal(v.netShares) : null,
    cashBonusUsd: v.cashBonusUsd != null ? numFromDecimal(v.cashBonusUsd) : null,
  }
}

async function findOwnedPlan(prisma: PrismaClient, userId: string, id: string) {
  const plan = await prisma.rsuPlan.findFirst({
    where: { id, userId },
    include: { vests: { orderBy: { sequence: "asc" } } },
  })
  if (!plan) throw new Error("Not found")
  return plan
}

export async function listRsuPlanSummaries(prisma: PrismaClient, userId: string) {
  const plans = await prisma.rsuPlan.findMany({
    where: { userId },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: {
      vests: { orderBy: { sequence: "asc" } },
    },
  })

  return Promise.all(
    plans.map(async (p) => {
      const plan = serializeRsuPlan(p)
      const summary = summarizePlan(
        { totalShares: plan.totalShares, ticker: plan.ticker },
        p.vests.map(vestSummaryInput),
      )
      const quote = await getStockQuote(plan.ticker)
      const valuation = valuePlan(
        { totalShares: plan.totalShares, ticker: plan.ticker },
        p.vests.map(vestSummaryInput),
        quote.available ? { priceUsd: quote.priceUsd!, asOf: quote.asOf! } : null,
        plan.taxWithholdPct,
      )
      return { plan, summary, quote, valuation }
    }),
  )
}

export async function getRsuPlanDetail(prisma: PrismaClient, userId: string, id: string) {
  const p = await findOwnedPlan(prisma, userId, id)

  const plan = serializeRsuPlan(p)
  const vests = p.vests.map(serializeRsuVest)
  const vestInputs = p.vests.map(vestSummaryInput)

  const summary = summarizePlan({ totalShares: plan.totalShares, ticker: plan.ticker }, vestInputs)
  const quote = await getStockQuote(plan.ticker)
  const valuation = valuePlan(
    { totalShares: plan.totalShares, ticker: plan.ticker },
    vestInputs,
    quote.available ? { priceUsd: quote.priceUsd!, asOf: quote.asOf! } : null,
    plan.taxWithholdPct,
  )

  return { plan, vests, summary, quote, valuation }
}

export async function createRsuPlan(prisma: PrismaClient, userId: string, d: PlanCreate) {
  const grantDate = parseGrantDate(d.grantDate)
  const vestingPeriodMonths = d.vestingPeriodMonths ?? 48
  const vestIntervalMonths = d.vestIntervalMonths ?? 3
  const vestDayOfMonth = d.vestDayOfMonth ?? 20
  const taxWithholdPct = d.taxWithholdPct ?? 20
  const ticker = d.ticker.trim().toUpperCase()

  const schedule = buildVestSchedule({
    grantDate,
    totalShares: d.totalShares,
    vestingPeriodMonths,
    vestIntervalMonths,
    vestDayOfMonth,
  })

  const maxPos = await prisma.rsuPlan.aggregate({
    where: { userId },
    _max: { position: true },
  })
  const position = d.position ?? (maxPos._max.position ?? 0) + 1

  const created = await prisma.$transaction(async (tx) => {
    const plan = await tx.rsuPlan.create({
      data: {
        userId,
        name: d.name,
        ticker,
        totalShares: String(d.totalShares),
        grantDate,
        vestingPeriodMonths,
        vestIntervalMonths,
        vestDayOfMonth,
        taxWithholdPct: String(taxWithholdPct),
        notes: d.notes,
        position,
      },
    })

    for (const row of schedule) {
      await tx.rsuVest.create({
        data: {
          planId: plan.id,
          sequence: row.sequence,
          scheduledDate: row.scheduledDate,
          shares: String(row.shares),
          status: "PENDING",
        },
      })
    }

    return plan
  })

  return getRsuPlanDetail(prisma, userId, created.id)
}

export async function updateRsuPlan(
  prisma: PrismaClient,
  userId: string,
  id: string,
  d: { name?: string; taxWithholdPct?: number; notes?: string | null; position?: number },
) {
  await findOwnedPlan(prisma, userId, id)

  await prisma.rsuPlan.update({
    where: { id },
    data: {
      ...(d.name != null && { name: d.name }),
      ...(d.taxWithholdPct != null && { taxWithholdPct: String(d.taxWithholdPct) }),
      ...(d.notes !== undefined && { notes: d.notes }),
      ...(d.position != null && { position: d.position }),
    },
  })
  return getRsuPlanDetail(prisma, userId, id)
}

export async function deleteRsuPlan(prisma: PrismaClient, userId: string, id: string) {
  await findOwnedPlan(prisma, userId, id)
  await prisma.rsuPlan.delete({ where: { id } })
}

export async function listRsuVests(prisma: PrismaClient, userId: string, planId: string) {
  await findOwnedPlan(prisma, userId, planId)
  const rows = await prisma.rsuVest.findMany({
    where: { planId },
    orderBy: { sequence: "asc" },
  })
  return rows.map(serializeRsuVest)
}

export async function receiveRsuVest(
  prisma: PrismaClient,
  userId: string,
  planId: string,
  vestId: string,
  receivedAt?: string,
) {
  const plan = await findOwnedPlan(prisma, userId, planId)
  const vest = await prisma.rsuVest.findFirstOrThrow({
    where: { id: vestId, planId },
  })

  if (vest.status === "RECEIVED") {
    throw new Error("Vest already received")
  }

  const shares = numFromDecimal(vest.shares)
  const taxPct = numFromDecimal(plan.taxWithholdPct)
  const quote = await getStockQuote(plan.ticker)
  if (!quote.available || quote.priceUsd == null || quote.priceUsd <= 0) {
    throw new Error(quote.error ?? "Stock quote required to mark vest received")
  }

  const settlement = settleVestReceive(shares, taxPct, quote.priceUsd)
  const when = receivedAt ? parseGrantDate(receivedAt) : new Date()

  await prisma.rsuVest.update({
    where: { id: vestId },
    data: {
      status: "RECEIVED",
      receivedAt: when,
      sharesWithheld: String(settlement.sharesWithheld),
      netShares: String(settlement.netWholeShares),
      cashBonusUsd: settlement.cashBonusUsd > 0 ? String(settlement.cashBonusUsd) : null,
    },
  })

  return getRsuPlanDetail(prisma, userId, planId)
}

export async function undoRsuVestReceive(
  prisma: PrismaClient,
  userId: string,
  planId: string,
  vestId: string,
) {
  await findOwnedPlan(prisma, userId, planId)
  const vest = await prisma.rsuVest.findFirstOrThrow({
    where: { id: vestId, planId },
  })

  if (vest.status !== "RECEIVED") {
    throw new Error("Vest is not received")
  }

  await prisma.rsuVest.update({
    where: { id: vestId },
    data: {
      status: "PENDING",
      receivedAt: null,
      sharesWithheld: null,
      netShares: null,
      cashBonusUsd: null,
    },
  })

  return getRsuPlanDetail(prisma, userId, planId)
}
