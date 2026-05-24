import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import { serializeSavings } from "@/lib/serialize"
import { savingsCreateZ } from "@/lib/validators"
import type { z } from "zod"

type SavingsCreate = z.infer<typeof savingsCreateZ>

export async function listSerializedSavingsGoals(prisma: PrismaClient) {
  const goals = await prisma.savingsGoal.findMany({
    orderBy: [{ priorityOrder: "asc" }, { name: "asc" }],
  })
  return goals.map(serializeSavings)
}

export async function createSavingsGoal(prisma: PrismaClient, d: SavingsCreate) {
  const maxPos = await prisma.savingsGoal.aggregate({ _max: { priorityOrder: true } })
  const nextDefault = (maxPos._max.priorityOrder ?? 0) + 1
  const priorityOrder = d.priorityOrder ?? nextDefault
  const opening = d.currentAmount ?? 0
  const currency = d.currency ?? "CRC"

  return prisma.$transaction(async (tx) => {
    const created = await tx.savingsGoal.create({
      data: {
        name: d.name,
        currency,
        targetAmount: d.targetAmount == null ? null : String(d.targetAmount),
        currentAmount: String(opening),
        color: d.color,
        notes: d.notes,
        priorityOrder,
      },
    })

    if (opening > 0) {
      await tx.savingsGoalMovement.create({
        data: {
          goalId: created.id,
          kind: "INITIAL",
          amount: String(opening),
          description: "Already saved",
        },
      })
    }

    return serializeSavings(created)
  })
}
