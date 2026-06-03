import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import {
  ensureIncomeProfilesFromSettings,
  patchCurrentIncomeProfileSalary,
} from "@/lib/income/services/income-profile.service"
import { serializeSettings } from "@/lib/shared/serialize"
import { type settingsPatchZ } from "@/lib/shared/validators"
import type { z } from "zod"

export type SettingsPatch = z.infer<typeof settingsPatchZ>

export async function getSerializedSettings(prisma: PrismaClient, userId: string) {
  await ensureIncomeProfilesFromSettings(prisma, userId)
  const s = await prisma.appSettings.findUniqueOrThrow({
    where: { userId },
  })
  return serializeSettings(s)
}

export async function patchSerializedSettings(
  prisma: PrismaClient,
  userId: string,
  d: SettingsPatch,
) {
  const salaryPatch = {
    ...(d.crSalaryGross != null && { crSalaryGross: d.crSalaryGross }),
    ...(d.crSalaryCurrency != null && { crSalaryCurrency: d.crSalaryCurrency }),
    ...(d.crPayPeriod != null && { crPayPeriod: d.crPayPeriod }),
    ...(d.crSolidaristaPct != null && { crSolidaristaPct: d.crSolidaristaPct }),
    ...(d.crPensionComplementariaPct != null && {
      crPensionComplementariaPct: d.crPensionComplementariaPct,
    }),
    ...(d.crEsppPct != null && { crEsppPct: d.crEsppPct }),
  }
  const hasSalaryFields = Object.keys(salaryPatch).length > 0

  if (hasSalaryFields) {
    await patchCurrentIncomeProfileSalary(prisma, userId, salaryPatch)
  }

  const updated = await prisma.appSettings.update({
    where: { userId },
    data: {
      ...(d.crCrcPerUsd != null && { crCrcPerUsd: String(d.crCrcPerUsd) }),
    },
  })
  return serializeSettings(updated)
}
