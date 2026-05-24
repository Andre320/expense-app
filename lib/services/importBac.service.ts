import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import { loadStoreMappingContext } from "@/lib/import-store-context"
import { parseBacComprasDelPeriodo } from "@/lib/parsers/bacParser"
import { matchStoreMapping } from "@/lib/store-mapping"

export type BacImportPreviewRow = {
  reference: string
  occurredAt: string
  bankDescription: string
  displayName: string
  categoryId: string
  categoryName: string
  matchedPattern: string | null
  currencyCode: "CRC" | "USD"
  amountOriginal: number
  amountColones: number | null
  amountDollars: number | null
}

/**
 * Parse BAC statement plain text and apply store mappings + category names.
 */
export async function buildBacImportPreview(
  prisma: PrismaClient,
  fullText: string,
): Promise<{ transactions: BacImportPreviewRow[]; warnings: string[] }> {
  const parsed = parseBacComprasDelPeriodo(fullText)
  const { rules, uncategorizedCategoryId } = await loadStoreMappingContext()
  const categoryNames = await prisma.category.findMany({
    where: {
      id: {
        in: [...new Set([...rules.map((x) => x.categoryId), uncategorizedCategoryId])],
      },
    },
    select: { id: true, name: true },
  })
  const nameById = new Map(categoryNames.map((c) => [c.id, c.name]))

  const transactions: BacImportPreviewRow[] = parsed.map((r) => {
    const m = matchStoreMapping(r.description, rules, {
      displayName: r.description.trim(),
      categoryId: uncategorizedCategoryId,
    })
    return {
      reference: r.reference,
      occurredAt: r.occurredAt,
      bankDescription: r.description,
      displayName: m.displayName,
      categoryId: m.categoryId,
      categoryName: nameById.get(m.categoryId) ?? "Uncategorized",
      matchedPattern: m.matchedPattern,
      currencyCode: r.currencyCode,
      amountOriginal: r.amountOriginal,
      amountColones: r.currencyCode === "CRC" ? r.amountOriginal : null,
      amountDollars: r.currencyCode === "USD" ? r.amountOriginal : null,
    }
  })

  const warnings =
    transactions.length === 0
      ? [
          "No purchase rows found under “B) Detalle de compras del periodo”. If this PDF uses a different layout, contact support.",
        ]
      : []

  return { transactions, warnings }
}
