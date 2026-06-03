import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import type { IncomeProfileRow } from "@/lib/income/income-profile-period"
import { serializeIncomeProfile } from "@/lib/shared/serialize"

function toRow(p: {
  id: string
  label: string
  effectiveFrom: Date
  effectiveTo: Date | null
  crSalaryGross: unknown
  crSalaryCurrency: string
  crPayPeriod: string
  crSolidaristaPct: unknown
  crPensionComplementariaPct: unknown
  crEsppPct: unknown
  position: number
}): IncomeProfileRow {
  return p
}

export async function listIncomeProfileRows(
  prisma: PrismaClient,
  userId: string,
): Promise<IncomeProfileRow[]> {
  const rows = await prisma.incomeProfile.findMany({
    where: { userId },
    orderBy: [{ effectiveFrom: "desc" }, { position: "asc" }],
  })
  return rows.map(toRow)
}

export async function listSerializedIncomeProfiles(prisma: PrismaClient, userId: string) {
  const rows = await prisma.incomeProfile.findMany({
    where: { userId },
    orderBy: [{ effectiveFrom: "desc" }, { position: "asc" }],
  })
  return rows.map(serializeIncomeProfile)
}
