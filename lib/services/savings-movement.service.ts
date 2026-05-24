import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import {
  serializeSavingsAccount,
  serializeSavingsAccountMovement,
  serializeSavingsGoalMovement,
} from "@/lib/serialize"
import { applyMovementToBalance, type SavingsMovementKind } from "@/lib/savings-movement"
import { numFromDecimal } from "@/lib/utils"
import { savingsMovementCreateZ } from "@/lib/validators"
import type { z } from "zod"

type MovementCreate = z.infer<typeof savingsMovementCreateZ>

function parseOccurredAt(value?: string): Date {
  if (!value) return new Date()
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) throw new Error("Invalid occurredAt")
  return d
}

function validateMovementAmount(kind: SavingsMovementKind, amount: number) {
  if (kind === "ADJUSTMENT") {
    if (amount < 0) throw new Error("Adjustment balance cannot be negative")
    return
  }
  if (amount <= 0) throw new Error("Amount must be positive")
}

export async function applySavingsAccountMovement(
  prisma: PrismaClient,
  accountId: string,
  input: MovementCreate,
) {
  const d = savingsMovementCreateZ.parse(input)
  validateMovementAmount(d.kind, d.amount)
  const occurredAt = parseOccurredAt(d.occurredAt)

  return prisma.$transaction(async (tx) => {
    const account = await tx.savingsAccount.findUniqueOrThrow({ where: { id: accountId } })
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
  goalId: string,
  input: MovementCreate,
) {
  const d = savingsMovementCreateZ.parse(input)
  validateMovementAmount(d.kind, d.amount)
  const occurredAt = parseOccurredAt(d.occurredAt)

  return prisma.$transaction(async (tx) => {
    const goal = await tx.savingsGoal.findUniqueOrThrow({ where: { id: goalId } })
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

export async function listSavingsAccountMovements(prisma: PrismaClient, accountId: string) {
  const rows = await prisma.savingsAccountMovement.findMany({
    where: { accountId },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: 50,
  })
  return rows.map(serializeSavingsAccountMovement)
}

export async function listSavingsGoalMovements(prisma: PrismaClient, goalId: string) {
  const rows = await prisma.savingsGoalMovement.findMany({
    where: { goalId },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: 50,
  })
  return rows.map(serializeSavingsGoalMovement)
}
