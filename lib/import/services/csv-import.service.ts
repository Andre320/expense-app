import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import { computeDualAmounts } from "@/lib/shared/currency"
import { numFromDecimal } from "@/lib/shared/utils"
import { type csvImportZ } from "@/lib/shared/validators"
import type { z } from "zod"

export type CsvImportInput = z.infer<typeof csvImportZ>

export async function importCsvTransactions(
  prisma: PrismaClient,
  userId: string,
  input: CsvImportInput,
) {
  const settings = await prisma.appSettings.findUniqueOrThrow({
    where: { userId },
  })
  const crcPerUsd = numFromDecimal(settings.crCrcPerUsd)

  let created = 0
  const errors: string[] = []

  for (let i = 0; i < input.rows.length; i++) {
    const row = input.rows[i]!
    const occurredAt = new Date(row.occurredAt)
    if (Number.isNaN(occurredAt.getTime())) {
      errors.push(`Row ${i + 1}: invalid date`)
      continue
    }

    let categoryId: string | null = null
    if (row.categoryId?.trim()) {
      const byId = await prisma.category.findFirst({
        where: { id: row.categoryId.trim(), userId, kind: row.kind },
      })
      categoryId = byId?.id ?? null
    }
    if (!categoryId && row.categoryName?.trim()) {
      const cat = await prisma.category.findFirst({
        where: {
          userId,
          name: { equals: row.categoryName.trim() },
          kind: row.kind,
        },
      })
      categoryId = cat?.id ?? null
    }

    const dual = computeDualAmounts({
      amountOriginal: row.amountOriginal,
      currencyCode: row.currencyCode,
      crcPerUsd,
    })

    await prisma.transaction.create({
      data: {
        userId,
        occurredAt,
        kind: row.kind,
        description: row.description ?? "",
        categoryId,
        amountOriginal: String(row.amountOriginal),
        currencyCode: row.currencyCode.toUpperCase(),
        rateToBase: String(dual.rateToBase),
        amountBase: String(dual.amountBase),
        rateToQuote: String(dual.rateToQuote),
        amountQuote: String(dual.amountQuote),
      },
    })
    created++
  }

  return { created, errors }
}
