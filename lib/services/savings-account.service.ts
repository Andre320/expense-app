import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import { serializeSavingsAccount } from "@/lib/serialize"
import { savingsAccountCreateZ } from "@/lib/validators"
import type { z } from "zod"

type AccountCreate = z.infer<typeof savingsAccountCreateZ>
type AccountUpdate = Partial<AccountCreate>

export async function listSerializedSavingsAccounts(prisma: PrismaClient) {
  const rows = await prisma.savingsAccount.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
  })
  return rows.map(serializeSavingsAccount)
}

export async function createSavingsAccount(prisma: PrismaClient, d: AccountCreate) {
  const maxPos = await prisma.savingsAccount.aggregate({ _max: { position: true } })
  const position = d.position ?? (maxPos._max.position ?? 0) + 1
  const opening = d.balance ?? 0
  const currency = d.currency ?? "CRC"

  return prisma.$transaction(async (tx) => {
    const created = await tx.savingsAccount.create({
      data: {
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

export async function updateSavingsAccount(prisma: PrismaClient, id: string, d: AccountUpdate) {
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

export async function deleteSavingsAccount(prisma: PrismaClient, id: string) {
  await prisma.savingsAccount.delete({ where: { id } })
}
