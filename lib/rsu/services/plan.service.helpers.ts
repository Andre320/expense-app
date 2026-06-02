import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import { numFromDecimal } from "@/lib/shared/utils"

export function parseGrantDate(value: string): Date {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) throw new Error("Invalid grantDate")
  return d
}

export function vestSummaryInput(v: {
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

export async function findOwnedPlan(prisma: PrismaClient, userId: string, id: string) {
  const plan = await prisma.rsuPlan.findFirst({
    where: { id, userId },
    include: { vests: { orderBy: { sequence: "asc" } } },
  })
  if (!plan) throw new Error("Not found")
  return plan
}
