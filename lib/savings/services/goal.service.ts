import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import { serializeSavings } from "@/lib/shared/serialize"
import { numFromDecimal } from "@/lib/shared/utils"
import { type savingsCreateZ, type savingsUpdateZ } from "@/lib/shared/validators"
import { applySavingsGoalMovement } from "@/lib/savings/services/movement.service"
import type { z } from "zod"

type SavingsCreate = z.infer<typeof savingsCreateZ>
type SavingsUpdate = z.infer<typeof savingsUpdateZ>

export async function listSerializedSavingsGoals(prisma: PrismaClient, userId: string) {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: [{ priorityOrder: "asc" }, { name: "asc" }],
  })
  return goals.map(serializeSavings)
}

export async function createSavingsGoal(prisma: PrismaClient, userId: string, d: SavingsCreate) {
  const maxPos = await prisma.savingsGoal.aggregate({
    where: { userId },
    _max: { priorityOrder: true },
  })
  const nextDefault = (maxPos._max.priorityOrder ?? 0) + 1
  const priorityOrder = d.priorityOrder ?? nextDefault
  const opening = d.currentAmount ?? 0
  const currency = d.currency ?? "CRC"

  return prisma.$transaction(async (tx) => {
    const created = await tx.savingsGoal.create({
      data: {
        userId,
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

export async function updateSavingsGoal(
  prisma: PrismaClient,
  userId: string,
  id: string,
  d: SavingsUpdate,
) {
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } })
  if (!goal) throw new Error("Not found")

  if (d.currentAmount != null) {
    const current = numFromDecimal(goal.currentAmount)
    if (d.currentAmount !== current) {
      await applySavingsGoalMovement(prisma, userId, id, {
        kind: "ADJUSTMENT",
        amount: d.currentAmount,
        description: "Balance correction",
      })
    }
  }

  try {
    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: {
        ...(d.name != null && { name: d.name }),
        ...(d.targetAmount !== undefined && {
          targetAmount: d.targetAmount == null ? null : String(d.targetAmount),
        }),
        ...(d.priorityOrder !== undefined && { priorityOrder: d.priorityOrder }),
        ...(d.color !== undefined && { color: d.color }),
        ...(d.notes !== undefined && { notes: d.notes }),
      },
    })
    return serializeSavings(updated)
  } catch {
    throw new Error("Not found")
  }
}

export async function deleteSavingsGoal(prisma: PrismaClient, userId: string, id: string) {
  const existing = await prisma.savingsGoal.findFirst({ where: { id, userId } })
  if (!existing) throw new Error("Not found")
  await prisma.savingsGoal.delete({ where: { id } })
}
