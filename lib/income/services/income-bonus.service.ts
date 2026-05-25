import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import { stringifyBonusMonths } from "@/lib/income/bonus"
import { serializeIncomeBonus } from "@/lib/shared/serialize"
import { type incomeBonusCreateZ } from "@/lib/shared/validators"
import type { z } from "zod"

type IncomeBonusCreate = z.infer<typeof incomeBonusCreateZ>
type IncomeBonusUpdate = Partial<IncomeBonusCreate>

export async function listSerializedIncomeBonuses(prisma: PrismaClient, userId: string) {
  const rows = await prisma.incomeBonus.findMany({
    where: { userId },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  })
  return rows.map(serializeIncomeBonus)
}

export async function createIncomeBonus(
  prisma: PrismaClient,
  userId: string,
  d: IncomeBonusCreate,
) {
  const maxPos = await prisma.incomeBonus.aggregate({
    where: { userId },
    _max: { position: true },
  })
  const nextDefault = (maxPos._max.position ?? 0) + 1
  const position = d.position ?? nextDefault
  const created = await prisma.incomeBonus.create({
    data: {
      userId,
      name: d.name,
      grossAmount: String(d.grossAmount),
      grossCurrency: d.grossCurrency ?? "CRC",
      months: stringifyBonusMonths(d.months),
      position,
    },
  })
  return serializeIncomeBonus(created)
}

export async function updateIncomeBonus(
  prisma: PrismaClient,
  userId: string,
  id: string,
  d: IncomeBonusUpdate,
) {
  const existing = await prisma.incomeBonus.findFirst({ where: { id, userId } })
  if (!existing) throw new Error("Not found")

  const updated = await prisma.incomeBonus.update({
    where: { id },
    data: {
      ...(d.name != null && { name: d.name }),
      ...(d.grossAmount != null && { grossAmount: String(d.grossAmount) }),
      ...(d.grossCurrency != null && { grossCurrency: d.grossCurrency }),
      ...(d.months != null && { months: stringifyBonusMonths(d.months) }),
      ...(d.position != null && { position: d.position }),
    },
  })
  return serializeIncomeBonus(updated)
}

export async function deleteIncomeBonus(prisma: PrismaClient, userId: string, id: string) {
  const existing = await prisma.incomeBonus.findFirst({ where: { id, userId } })
  if (!existing) throw new Error("Not found")
  await prisma.incomeBonus.delete({ where: { id } })
}
