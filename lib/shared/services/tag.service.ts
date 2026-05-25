import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"

function serializeTag(t: { id: string; name: string }) {
  return { id: t.id, name: t.name }
}

export async function listTags(prisma: PrismaClient, userId: string) {
  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  })
  return tags.map(serializeTag)
}

export async function upsertTag(prisma: PrismaClient, userId: string, name: string) {
  const tag = await prisma.tag.upsert({
    where: { userId_name: { userId, name } },
    create: { userId, name },
    update: {},
  })
  return serializeTag(tag)
}
