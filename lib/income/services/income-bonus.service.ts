import "server-only"

import { parseISO } from "date-fns"
import type { PrismaClient } from "@/app/generated/prisma/client"
import { serializeIncomeBonus } from "@/lib/shared/serialize"
import { type incomeBonusCreateZ } from "@/lib/shared/validators"
import type { z } from "zod"

type IncomeBonusCreate = z.infer<typeof incomeBonusCreateZ>
type IncomeBonusUpdate = Partial<IncomeBonusCreate>

function parsePaidOn(isoDate: string): Date {
  return parseISO(isoDate)
}

export async function listSerializedIncomeBonuses(prisma: PrismaClient, userId: string) {
  const rows = await prisma.incomeBonus.findMany({
    where: { userId },
    orderBy: [{ paidOn: "desc" }, { position: "asc" }, { name: "asc" }],
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
      paidOn: parsePaidOn(d.paidOn),
      repeatsAnnually: d.repeatsAnnually ?? false,
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
      ...(d.paidOn != null && { paidOn: parsePaidOn(d.paidOn) }),
      ...(d.repeatsAnnually != null && { repeatsAnnually: d.repeatsAnnually }),
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
