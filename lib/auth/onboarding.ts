import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import { prisma as defaultPrisma } from "@/lib/db/client"
import { ensureIncomeProfilesFromSettings } from "@/lib/income/services/income-profile.service"

const DEFAULT_CATEGORIES = [
  { name: "Salary", kind: "INCOME" as const, position: 1, color: "#22d3ee" },
  { name: "Freelance", kind: "INCOME" as const, position: 2, color: "#38bdf8" },
  { name: "Housing", kind: "EXPENSE" as const, position: 1, color: "#f472b6" },
  { name: "Food", kind: "EXPENSE" as const, position: 2, color: "#fb923c" },
  { name: "Transport", kind: "EXPENSE" as const, position: 3, color: "#a78bfa" },
  { name: "Subscriptions", kind: "EXPENSE" as const, position: 4, color: "#94a3b8" },
  {
    name: "Uncategorized",
    kind: "EXPENSE" as const,
    position: 99,
    color: "#71717a",
  },
]

export async function ensureUserDefaults(userId: string, prisma: PrismaClient = defaultPrisma) {
  await prisma.appSettings.upsert({
    where: { userId },
    create: { userId },
    update: {},
  })

  await ensureIncomeProfilesFromSettings(prisma, userId)

  for (const c of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        userId_name_kind: {
          userId,
          name: c.name,
          kind: c.kind,
        },
      },
      create: {
        userId,
        name: c.name,
        kind: c.kind,
        position: c.position,
        color: c.color,
      },
      update: { position: c.position, color: c.color },
    })
  }
}
