import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import { type knownStoreCreateZ, type knownStoreUpdateZ } from "@/lib/shared/validators"
import type { z } from "zod"

export type KnownStoreCreate = z.infer<typeof knownStoreCreateZ>
export type KnownStoreUpdate = z.infer<typeof knownStoreUpdateZ>

type KnownStoreWithCategory = {
  id: string
  pattern: string
  displayName: string
  categoryId: string
  position: number
  createdAt?: Date
  updatedAt?: Date
  category: { id: string; name: string; kind: string }
}

function serializeKnownStore(r: KnownStoreWithCategory, includeTimestamps = false) {
  return {
    id: r.id,
    pattern: r.pattern,
    displayName: r.displayName,
    categoryId: r.categoryId,
    categoryName: r.category.name,
    ...(includeTimestamps && {
      categoryKind: r.category.kind,
      position: r.position,
      createdAt: r.createdAt!.toISOString(),
      updatedAt: r.updatedAt!.toISOString(),
    }),
    ...(!includeTimestamps && { position: r.position }),
  }
}

const categoryInclude = { category: { select: { id: true, name: true, kind: true } } } as const

export async function listKnownStores(prisma: PrismaClient, userId: string) {
  const rows = await prisma.knownStore.findMany({
    where: { userId },
    orderBy: [{ position: "asc" }, { pattern: "asc" }],
    include: categoryInclude,
  })
  return rows.map((r) => serializeKnownStore(r, true))
}

export async function createKnownStore(prisma: PrismaClient, userId: string, d: KnownStoreCreate) {
  const cat = await prisma.category.findFirst({
    where: { id: d.categoryId, userId },
  })
  if (!cat) throw new Error("Category not found")

  const patternNorm = d.pattern.trim().toLowerCase()
  const existingPatterns = await prisma.knownStore.findMany({
    where: { userId },
    select: { pattern: true },
  })
  if (existingPatterns.some((s) => s.pattern.toLowerCase() === patternNorm)) {
    throw new Error("A mapping with this pattern already exists")
  }

  const maxPos = await prisma.knownStore.aggregate({
    where: { userId },
    _max: { position: true },
  })
  const position = (maxPos._max.position ?? 0) + 1

  const created = await prisma.knownStore.create({
    data: {
      userId,
      pattern: d.pattern.trim(),
      displayName: d.displayName.trim(),
      categoryId: d.categoryId,
      position,
    },
    include: categoryInclude,
  })

  return serializeKnownStore(created)
}

export async function updateKnownStore(
  prisma: PrismaClient,
  userId: string,
  id: string,
  d: KnownStoreUpdate,
) {
  const existing = await prisma.knownStore.findFirst({
    where: { id, userId },
  })
  if (!existing) throw new Error("Not found")

  if (d.categoryId) {
    const cat = await prisma.category.findFirst({
      where: { id: d.categoryId, userId },
    })
    if (!cat) throw new Error("Category not found")
  }

  if (d.pattern) {
    const patternNorm = d.pattern.trim().toLowerCase()
    const all = await prisma.knownStore.findMany({
      where: { userId, id: { not: id } },
      select: { pattern: true },
    })
    if (all.some((s) => s.pattern.toLowerCase() === patternNorm)) {
      throw new Error("Another mapping already uses this pattern")
    }
  }

  try {
    const updated = await prisma.knownStore.update({
      where: { id },
      data: {
        ...(d.pattern != null && { pattern: d.pattern.trim() }),
        ...(d.displayName != null && { displayName: d.displayName.trim() }),
        ...(d.categoryId != null && { categoryId: d.categoryId }),
      },
      include: categoryInclude,
    })
    return serializeKnownStore(updated)
  } catch {
    throw new Error("Not found")
  }
}

export async function deleteKnownStore(prisma: PrismaClient, userId: string, id: string) {
  const existing = await prisma.knownStore.findFirst({ where: { id, userId } })
  if (!existing) throw new Error("Not found")
  await prisma.knownStore.delete({ where: { id } })
}
