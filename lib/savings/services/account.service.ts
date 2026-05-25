import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import { serializeSavingsAccount } from "@/lib/shared/serialize"
import { type savingsAccountCreateZ } from "@/lib/shared/validators"
import type { z } from "zod"

type AccountCreate = z.infer<typeof savingsAccountCreateZ>
type AccountUpdate = Partial<AccountCreate>

export async function listSerializedSavingsAccounts(prisma: PrismaClient, userId: string) {
  const rows = await prisma.savingsAccount.findMany({
    where: { userId },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  })
  return rows.map(serializeSavingsAccount)
}

export async function createSavingsAccount(prisma: PrismaClient, userId: string, d: AccountCreate) {
  const maxPos = await prisma.savingsAccount.aggregate({
    where: { userId },
    _max: { position: true },
  })
  const position = d.position ?? (maxPos._max.position ?? 0) + 1
  const opening = d.balance ?? 0
  const currency = d.currency ?? "CRC"

  return prisma.$transaction(async (tx) => {
    const created = await tx.savingsAccount.create({
      data: {
        userId,
        name: d.name,
        currency,
        balance: String(opening),
        notes: d.notes,
        position,
      },
    })

    if (opening > 0) {
      await tx.savingsAccountMovement.create({
        data: {
          accountId: created.id,
          kind: "INITIAL",
          amount: String(opening),
          description: "Opening balance",
        },
      })
    }

    return serializeSavingsAccount(created)
  })
}

export async function updateSavingsAccount(
  prisma: PrismaClient,
  userId: string,
  id: string,
  d: AccountUpdate,
) {
  const existing = await prisma.savingsAccount.findFirst({ where: { id, userId } })
  if (!existing) throw new Error("Not found")

  const updated = await prisma.savingsAccount.update({
    where: { id },
    data: {
      ...(d.name != null && { name: d.name }),
      ...(d.notes !== undefined && { notes: d.notes }),
      ...(d.position != null && { position: d.position }),
    },
  })
  return serializeSavingsAccount(updated)
}

export async function deleteSavingsAccount(prisma: PrismaClient, userId: string, id: string) {
  const existing = await prisma.savingsAccount.findFirst({ where: { id, userId } })
  if (!existing) throw new Error("Not found")
  await prisma.savingsAccount.delete({ where: { id } })
}
