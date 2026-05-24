import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import { serializeSettings } from "@/lib/serialize"
import { settingsPatchZ } from "@/lib/validators"
import type { z } from "zod"

export type SettingsPatch = z.infer<typeof settingsPatchZ>

export async function getSerializedSettings(prisma: PrismaClient) {
  const s = await prisma.appSettings.findUniqueOrThrow({
    where: { id: "default" },
  })
  return serializeSettings(s)
}

export async function patchSerializedSettings(prisma: PrismaClient, d: SettingsPatch) {
  const updated = await prisma.appSettings.update({
    where: { id: "default" },
    data: {
      ...(d.crSalaryGross != null && { crSalaryGross: String(d.crSalaryGross) }),
      ...(d.crSalaryCurrency != null && { crSalaryCurrency: d.crSalaryCurrency }),
      ...(d.crPayPeriod != null && { crPayPeriod: d.crPayPeriod }),
      ...(d.crCrcPerUsd != null && { crCrcPerUsd: String(d.crCrcPerUsd) }),
      ...(d.crSolidaristaPct != null && {
        crSolidaristaPct: String(d.crSolidaristaPct),
      }),
      ...(d.crPensionComplementariaPct != null && {
        crPensionComplementariaPct: String(d.crPensionComplementariaPct),
      }),
      ...(d.crEsppPct != null && { crEsppPct: String(d.crEsppPct) }),
    },
  })
  return serializeSettings(updated)
}
