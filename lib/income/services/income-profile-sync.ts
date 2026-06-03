import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import {
  pickDeductionFallback,
  profileHasVoluntaryDeductions,
} from "@/lib/income/income-profile-deductions"
import { getCurrentOpenProfile, type IncomeProfileRow } from "@/lib/income/income-profile-period"
import { numFromDecimal } from "@/lib/shared/decimal"
import { listIncomeProfileRows } from "@/lib/income/services/income-profile-list"

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

/** Copy Solidarista / pension / ESPP from template when older periods were saved at 0%. */
export async function repairProfileVoluntaryDeductions(prisma: PrismaClient, userId: string) {
  const settings = await prisma.appSettings.findUnique({ where: { userId } })
  const profiles = await listIncomeProfileRows(prisma, userId)
  const fallback = pickDeductionFallback(profiles, settings)
  if (!fallback) return

  for (const profile of profiles) {
    if (profileHasVoluntaryDeductions(profile)) continue
    await prisma.incomeProfile.update({
      where: { id: profile.id },
      data: {
        crSolidaristaPct: String(numFromDecimal(fallback.crSolidaristaPct)),
        crPensionComplementariaPct: String(numFromDecimal(fallback.crPensionComplementariaPct)),
        crEsppPct: String(numFromDecimal(fallback.crEsppPct)),
      },
    })
  }
}

export async function ensureIncomeProfilesFromSettings(prisma: PrismaClient, userId: string) {
  const count = await prisma.incomeProfile.count({ where: { userId } })
  if (count > 0) return

  const settings = await prisma.appSettings.findUnique({ where: { userId } })
  if (!settings) return

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  })

  await prisma.incomeProfile.create({
    data: {
      userId,
      label: numFromDecimal(settings.crSalaryGross) > 0 ? "Salary" : "Salary (default)",
      effectiveFrom: user?.createdAt ?? new Date(),
      effectiveTo: null,
      crSalaryGross: settings.crSalaryGross,
      crSalaryCurrency: settings.crSalaryCurrency,
      crPayPeriod: settings.crPayPeriod,
      crSolidaristaPct: settings.crSolidaristaPct,
      crPensionComplementariaPct: settings.crPensionComplementariaPct,
      crEsppPct: settings.crEsppPct,
      position: 1,
    },
  })
}

export async function syncAppSettingsMirror(prisma: PrismaClient, userId: string) {
  const profiles = await listIncomeProfileRows(prisma, userId)
  const current =
    getCurrentOpenProfile(profiles) ??
    profiles.sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0]

  if (!current) return

  await prisma.appSettings.update({
    where: { userId },
    data: {
      crSalaryGross: String(numFromDecimal(current.crSalaryGross)),
      crSalaryCurrency: current.crSalaryCurrency,
      crPayPeriod: current.crPayPeriod,
      crSolidaristaPct: String(numFromDecimal(current.crSolidaristaPct)),
      crPensionComplementariaPct: String(numFromDecimal(current.crPensionComplementariaPct)),
      crEsppPct: String(numFromDecimal(current.crEsppPct)),
    },
  })
}

export async function patchCurrentIncomeProfileSalary(
  prisma: PrismaClient,
  userId: string,
  patch: {
    crSalaryGross?: number
    crSalaryCurrency?: string
    crPayPeriod?: string
    crSolidaristaPct?: number
    crPensionComplementariaPct?: number
    crEsppPct?: number
  },
) {
  await ensureIncomeProfilesFromSettings(prisma, userId)
  const profiles = await listIncomeProfileRows(prisma, userId)
  let current = getCurrentOpenProfile(profiles)

  if (!current) {
    const settings = await prisma.appSettings.findUniqueOrThrow({ where: { userId } })
    const created = await prisma.incomeProfile.create({
      data: {
        userId,
        label: "Salary",
        effectiveFrom: new Date(),
        crSalaryGross: settings.crSalaryGross,
        crSalaryCurrency: settings.crSalaryCurrency,
        crPayPeriod: settings.crPayPeriod,
        crSolidaristaPct: settings.crSolidaristaPct,
        crPensionComplementariaPct: settings.crPensionComplementariaPct,
        crEsppPct: settings.crEsppPct,
        position: 1,
      },
    })
    current = toRow(created)
  }

  const updated = await prisma.incomeProfile.update({
    where: { id: current.id },
    data: {
      ...(patch.crSalaryGross != null && { crSalaryGross: String(patch.crSalaryGross) }),
      ...(patch.crSalaryCurrency != null && { crSalaryCurrency: patch.crSalaryCurrency }),
      ...(patch.crPayPeriod != null && { crPayPeriod: patch.crPayPeriod }),
      ...(patch.crSolidaristaPct != null && {
        crSolidaristaPct: String(patch.crSolidaristaPct),
      }),
      ...(patch.crPensionComplementariaPct != null && {
        crPensionComplementariaPct: String(patch.crPensionComplementariaPct),
      }),
      ...(patch.crEsppPct != null && { crEsppPct: String(patch.crEsppPct) }),
    },
  })

  await syncAppSettingsMirror(prisma, userId)
  return toRow(updated)
}
