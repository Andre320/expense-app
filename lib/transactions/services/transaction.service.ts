import "server-only"

import type { Prisma, PrismaClient } from "@/app/generated/prisma/client"
import { computeDualAmounts } from "@/lib/shared/currency"
import { serializeTransaction } from "@/lib/shared/serialize"
import { numFromDecimal } from "@/lib/shared/utils"
import { type transactionCreateZ, type transactionUpdateZ } from "@/lib/shared/validators"
import type { z } from "zod"

export type TransactionCreate = z.infer<typeof transactionCreateZ>
export type TransactionUpdate = z.infer<typeof transactionUpdateZ>

const sortable = new Set(["occurredAt", "amountBase", "kind", "description", "createdAt"])

export type TransactionListQuery = {
  page: number
  pageSize: number
  kind?: string | null
  q?: string | null
  sortBy?: string | null
  sortDir?: string | null
}

export async function listTransactions(
  prisma: PrismaClient,
  userId: string,
  query: TransactionListQuery,
) {
  const page = Math.max(1, query.page)
  const pageSize = Math.min(100, Math.max(1, query.pageSize))
  const kind = query.kind
  const q = query.q?.trim()
  const sortBy = query.sortBy ?? "occurredAt"
  const sortDir = query.sortDir === "asc" ? ("asc" as const) : ("desc" as const)
  const orderField = sortable.has(sortBy) ? sortBy : "occurredAt"

  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(kind === "INCOME" || kind === "EXPENSE" ? { kind } : {}),
    ...(q
      ? {
          OR: [{ description: { contains: q } }, { category: { name: { contains: q } } }],
        }
      : {}),
  }

  const [total, rows] = await prisma.$transaction([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { [orderField]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    }),
  ])

  return {
    items: rows.map(serializeTransaction),
    total,
    page,
    pageSize,
  }
}

async function getCrcPerUsd(prisma: PrismaClient, userId: string) {
  const settings = await prisma.appSettings.findUniqueOrThrow({
    where: { userId },
  })
  return numFromDecimal(settings.crCrcPerUsd)
}

async function assertOwnedCategory(prisma: PrismaClient, userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  })
  if (!category) throw new Error("Category not found")
}

async function assertOwnedTags(prisma: PrismaClient, userId: string, tagIds: string[]) {
  if (tagIds.length === 0) return
  const ownedTags = await prisma.tag.count({
    where: { userId, id: { in: tagIds } },
  })
  if (ownedTags !== tagIds.length) throw new Error("Invalid tag")
}

export async function createTransaction(
  prisma: PrismaClient,
  userId: string,
  d: TransactionCreate,
) {
  const crcPerUsd = await getCrcPerUsd(prisma, userId)
  const dual = computeDualAmounts({
    amountOriginal: d.amountOriginal,
    currencyCode: d.currencyCode,
    crcPerUsd,
  })

  const occurredAt = new Date(d.occurredAt)
  if (Number.isNaN(occurredAt.getTime())) throw new Error("Invalid occurredAt")

  if (d.categoryId) await assertOwnedCategory(prisma, userId, d.categoryId)

  const tagIds = d.tagIds ?? []
  await assertOwnedTags(prisma, userId, tagIds)

  const created = await prisma.transaction.create({
    data: {
      userId,
      occurredAt,
      kind: d.kind,
      description: d.description ?? "",
      categoryId: d.categoryId ?? null,
      amountOriginal: String(d.amountOriginal),
      currencyCode: d.currencyCode.toUpperCase(),
      rateToBase: String(dual.rateToBase),
      amountBase: String(dual.amountBase),
      rateToQuote: String(dual.rateToQuote),
      amountQuote: String(dual.amountQuote),
      tags: {
        create: tagIds.map((tagId) => ({
          tag: { connect: { id: tagId } },
        })),
      },
    },
    include: { category: true, tags: { include: { tag: true } } },
  })

  return serializeTransaction(created)
}

export async function updateTransaction(
  prisma: PrismaClient,
  userId: string,
  id: string,
  d: TransactionUpdate,
) {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
    include: { tags: true },
  })
  if (!existing) throw new Error("Not found")

  const crcPerUsd = await getCrcPerUsd(prisma, userId)

  const amountOriginal = d.amountOriginal ?? numFromDecimal(existing.amountOriginal)
  const currencyCode = (d.currencyCode ?? existing.currencyCode).toUpperCase()

  const dual = computeDualAmounts({
    amountOriginal,
    currencyCode,
    crcPerUsd,
  })

  const occurredAt = d.occurredAt ? new Date(d.occurredAt) : existing.occurredAt
  if (Number.isNaN(occurredAt.getTime())) throw new Error("Invalid occurredAt")

  const tagIds = d.tagIds
  if (d.categoryId) await assertOwnedCategory(prisma, userId, d.categoryId)
  if (tagIds && tagIds.length > 0) await assertOwnedTags(prisma, userId, tagIds)

  const updated = await prisma.$transaction(async (tx) => {
    if (tagIds) {
      await tx.transactionTag.deleteMany({ where: { transactionId: id } })
    }
    return tx.transaction.update({
      where: { id },
      data: {
        ...(d.kind != null && { kind: d.kind }),
        ...(d.description != null && { description: d.description }),
        ...(d.categoryId !== undefined && { categoryId: d.categoryId }),
        occurredAt,
        amountOriginal: String(amountOriginal),
        currencyCode,
        rateToBase: String(dual.rateToBase),
        amountBase: String(dual.amountBase),
        rateToQuote: String(dual.rateToQuote),
        amountQuote: String(dual.amountQuote),
        ...(tagIds != null && {
          tags: {
            create: tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          },
        }),
      },
      include: { category: true, tags: { include: { tag: true } } },
    })
  })

  return serializeTransaction(updated)
}

export async function deleteTransaction(prisma: PrismaClient, userId: string, id: string) {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } })
  if (!existing) throw new Error("Not found")
  await prisma.transaction.delete({ where: { id } })
}
