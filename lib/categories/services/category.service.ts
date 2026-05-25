import "server-only"

import type { Category, PrismaClient } from "@/app/generated/prisma/client"
import { type categoryCreateZ, type categoryUpdateZ } from "@/lib/shared/validators"
import type { z } from "zod"

export type CategoryCreate = z.infer<typeof categoryCreateZ>
export type CategoryUpdate = z.infer<typeof categoryUpdateZ>

const UNCATEGORIZED = { name: "Uncategorized", kind: "EXPENSE" as const }

function serializeCategory(c: Category) {
  return {
    id: c.id,
    name: c.name,
    kind: c.kind,
    color: c.color,
    position: c.position,
  }
}

export async function listCategories(prisma: PrismaClient, userId: string) {
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: [{ kind: "asc" }, { position: "asc" }, { name: "asc" }],
  })
  return categories.map(serializeCategory)
}

export async function createCategory(prisma: PrismaClient, userId: string, d: CategoryCreate) {
  const name = d.name.trim()
  const maxPos = await prisma.category.aggregate({
    where: { userId, kind: d.kind },
    _max: { position: true },
  })
  const position = (maxPos._max.position ?? 0) + 1

  try {
    const created = await prisma.category.create({
      data: {
        userId,
        name,
        kind: d.kind,
        color: d.color ?? "#6366f1",
        position,
      },
    })
    return serializeCategory(created)
  } catch {
    throw new Error("A category with this name and type already exists")
  }
}

export async function updateCategory(
  prisma: PrismaClient,
  userId: string,
  id: string,
  d: CategoryUpdate,
) {
  const existing = await prisma.category.findFirst({
    where: { id, userId },
  })
  if (!existing) throw new Error("Not found")

  if (
    existing.name === UNCATEGORIZED.name &&
    existing.kind === UNCATEGORIZED.kind &&
    (d.name != null || d.kind != null)
  ) {
    throw new Error("The Uncategorized category cannot be renamed or retyped")
  }

  const name = d.name != null ? d.name.trim() : undefined
  const kind = d.kind

  try {
    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name != null && { name }),
        ...(kind != null && { kind }),
        ...(d.color !== undefined && { color: d.color }),
      },
    })
    return serializeCategory(updated)
  } catch {
    throw new Error("Update failed (duplicate name for this type?)")
  }
}

export async function deleteCategory(prisma: PrismaClient, userId: string, id: string) {
  const existing = await prisma.category.findFirst({
    where: { id, userId },
  })
  if (!existing) throw new Error("Not found")
  if (existing.name === UNCATEGORIZED.name && existing.kind === UNCATEGORIZED.kind) {
    throw new Error("The Uncategorized category cannot be deleted")
  }

  await prisma.category.delete({ where: { id } })
}
