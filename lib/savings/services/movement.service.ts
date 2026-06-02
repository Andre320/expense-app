import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import {
  serializeSavingsAccount,
  serializeSavingsAccountMovement,
  serializeSavingsGoalMovement,
} from "@/lib/shared/serialize"
import { applyMovementToBalance, validateSavingsMovementAmount } from "@/lib/savings/movement"
import { numFromDecimal } from "@/lib/shared/utils"
import { savingsMovementCreateZ } from "@/lib/shared/validators"
import type { z } from "zod"

type MovementCreate = z.infer<typeof savingsMovementCreateZ>

function parseOccurredAt(value?: string): Date {
  if (!value) return new Date()
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) throw new Error("Invalid occurredAt")
  return d
}

export async function applySavingsAccountMovement(
  prisma: PrismaClient,
  userId: string,
  accountId: string,
  input: MovementCreate,
) {
  const d = savingsMovementCreateZ.parse(input)
  validateSavingsMovementAmount(d.kind, d.amount)
  const occurredAt = parseOccurredAt(d.occurredAt)

  return prisma.$transaction(async (tx) => {
    const account = await tx.savingsAccount.findFirst({ where: { id: accountId, userId } })
    if (!account) throw new Error("Not found")

    const current = numFromDecimal(account.balance)
    const next = applyMovementToBalance(current, d.kind, d.amount)

    const movement = await tx.savingsAccountMovement.create({
      data: {
        accountId,
        kind: d.kind,
        amount: String(d.kind === "ADJUSTMENT" ? next : d.amount),
        description: d.description ?? "",
        occurredAt,
      },
    })

    const updated = await tx.savingsAccount.update({
      where: { id: accountId },
      data: { balance: String(next) },
    })

    return {
      account: serializeSavingsAccount(updated),
      movement: serializeSavingsAccountMovement(movement),
    }
  })
}

export async function applySavingsGoalMovement(
  prisma: PrismaClient,
  userId: string,
  goalId: string,
  input: MovementCreate,
) {
  const d = savingsMovementCreateZ.parse(input)
  validateSavingsMovementAmount(d.kind, d.amount)
  const occurredAt = parseOccurredAt(d.occurredAt)

  return prisma.$transaction(async (tx) => {
    const goal = await tx.savingsGoal.findFirst({ where: { id: goalId, userId } })
    if (!goal) throw new Error("Not found")

    const current = numFromDecimal(goal.currentAmount)
    const next = applyMovementToBalance(current, d.kind, d.amount)

    const movement = await tx.savingsGoalMovement.create({
      data: {
        goalId,
        kind: d.kind,
        amount: String(d.kind === "ADJUSTMENT" ? next : d.amount),
        description: d.description ?? "",
        occurredAt,
      },
    })

    const updated = await tx.savingsGoal.update({
      where: { id: goalId },
      data: { currentAmount: String(next) },
    })

    return {
      goal: {
        id: updated.id,
        currentAmount: numFromDecimal(updated.currentAmount),
      },
      movement: serializeSavingsGoalMovement(movement),
    }
  })
}

export async function listSavingsAccountMovements(
  prisma: PrismaClient,
  userId: string,
  accountId: string,
) {
  const account = await prisma.savingsAccount.findFirst({ where: { id: accountId, userId } })
  if (!account) throw new Error("Not found")

  const rows = await prisma.savingsAccountMovement.findMany({
    where: { accountId },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: 50,
  })
  return rows.map(serializeSavingsAccountMovement)
}

export async function listSavingsGoalMovements(
  prisma: PrismaClient,
  userId: string,
  goalId: string,
) {
  const goal = await prisma.savingsGoal.findFirst({ where: { id: goalId, userId } })
  if (!goal) throw new Error("Not found")

  const rows = await prisma.savingsGoalMovement.findMany({
    where: { goalId },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: 50,
  })
  return rows.map(serializeSavingsGoalMovement)
}
