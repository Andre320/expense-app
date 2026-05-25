import "server-only"
import { prisma } from "@/lib/db/client"
import type { StoreMappingRule } from "@/lib/store/mapping"

export async function loadStoreMappingContext(userId: string): Promise<{
  rules: StoreMappingRule[]
  uncategorizedCategoryId: string
}> {
  const [stores, uncategorized] = await Promise.all([
    prisma.knownStore.findMany({
      where: { userId },
      orderBy: [{ position: "asc" }, { pattern: "asc" }],
      select: {
        id: true,
        pattern: true,
        displayName: true,
        categoryId: true,
        position: true,
      },
    }),
    prisma.category.findUnique({
      where: {
        userId_name_kind: {
          userId,
          name: "Uncategorized",
          kind: "EXPENSE",
        },
      },
      select: { id: true },
    }),
  ])

  if (!uncategorized) {
    throw new Error("Uncategorized expense category missing; run onboarding defaults")
  }

  return {
    rules: stores.map((s) => ({
      id: s.id,
      pattern: s.pattern,
      displayName: s.displayName,
      categoryId: s.categoryId,
      position: s.position,
    })),
    uncategorizedCategoryId: uncategorized.id,
  }
}
