import "server-only"

import type { PrismaClient } from "@/app/generated/prisma/client"
import {
  defaultVoluntaryDeductionsForCreate,
  pickDeductionFallback,
} from "@/lib/income/income-profile-deductions"
import {
  listIncomeProfileRows,
  listSerializedIncomeProfiles,
} from "@/lib/income/services/income-profile-list"
import {
  ensureIncomeProfilesFromSettings,
  patchCurrentIncomeProfileSalary,
  syncAppSettingsMirror,
} from "@/lib/income/services/income-profile-sync"
import {
  assertNoOverlap,
  assertSingleOpenEndedOnCreate,
  assertSingleOpenEndedOnUpdate,
  assertValidPeriodRange,
  IncomeProfileValidationError,
  parseEffectiveFrom,
  parseEffectiveTo,
} from "@/lib/income/services/income-profile-validation"
import { serializeIncomeProfile } from "@/lib/shared/serialize"
import { type incomeProfileCreateZ, type incomeProfileUpdateZ } from "@/lib/shared/validators"
import type { z } from "zod"

type IncomeProfileCreate = z.infer<typeof incomeProfileCreateZ>
type IncomeProfileUpdate = z.infer<typeof incomeProfileUpdateZ>

export {
  IncomeProfileValidationError,
  ensureIncomeProfilesFromSettings,
  listIncomeProfileRows,
  listSerializedIncomeProfiles,
  patchCurrentIncomeProfileSalary,
  syncAppSettingsMirror,
}

export async function createIncomeProfile(
  prisma: PrismaClient,
  userId: string,
  d: IncomeProfileCreate,
) {
  const profiles = await listIncomeProfileRows(prisma, userId)
  const effectiveFrom = parseEffectiveFrom(d.effectiveFrom)
  const effectiveTo = parseEffectiveTo(d.effectiveTo ?? null)

  assertValidPeriodRange(effectiveFrom, effectiveTo)
  assertSingleOpenEndedOnCreate(profiles, effectiveTo)
  assertNoOverlap(profiles, effectiveFrom, effectiveTo)

  const maxPos = await prisma.incomeProfile.aggregate({
    where: { userId },
    _max: { position: true },
  })

  const appSettings = await prisma.appSettings.findUnique({ where: { userId } })
  const deductionFallback = pickDeductionFallback(profiles, appSettings)
  const voluntary = defaultVoluntaryDeductionsForCreate(d, deductionFallback)

  const created = await prisma.incomeProfile.create({
    data: {
      userId,
      label: d.label,
      effectiveFrom,
      effectiveTo,
      crSalaryGross: String(d.crSalaryGross),
      crSalaryCurrency: d.crSalaryCurrency ?? "CRC",
      crPayPeriod: d.crPayPeriod ?? "MONTHLY",
      crSolidaristaPct: String(voluntary.crSolidaristaPct),
      crPensionComplementariaPct: String(voluntary.crPensionComplementariaPct),
      crEsppPct: String(voluntary.crEsppPct),
      position: d.position ?? (maxPos._max.position ?? 0) + 1,
    },
  })

  await syncAppSettingsMirror(prisma, userId)
  return serializeIncomeProfile(created)
}

function buildUpdateData(d: IncomeProfileUpdate, effectiveFrom: Date, effectiveTo: Date | null) {
  return {
    ...(d.label != null && { label: d.label }),
    ...(d.effectiveFrom != null && { effectiveFrom }),
    ...(d.effectiveTo !== undefined && { effectiveTo }),
    ...(d.crSalaryGross != null && { crSalaryGross: String(d.crSalaryGross) }),
    ...(d.crSalaryCurrency != null && { crSalaryCurrency: d.crSalaryCurrency }),
    ...(d.crPayPeriod != null && { crPayPeriod: d.crPayPeriod }),
    ...(d.crSolidaristaPct != null && { crSolidaristaPct: String(d.crSolidaristaPct) }),
    ...(d.crPensionComplementariaPct != null && {
      crPensionComplementariaPct: String(d.crPensionComplementariaPct),
    }),
    ...(d.crEsppPct != null && { crEsppPct: String(d.crEsppPct) }),
    ...(d.position != null && { position: d.position }),
  }
}

export async function updateIncomeProfile(
  prisma: PrismaClient,
  userId: string,
  id: string,
  d: IncomeProfileUpdate,
) {
  const existing = await prisma.incomeProfile.findFirst({ where: { id, userId } })
  if (!existing) throw new Error("Not found")

  const profiles = await listIncomeProfileRows(prisma, userId)
  const effectiveFrom =
    d.effectiveFrom != null ? parseEffectiveFrom(d.effectiveFrom) : existing.effectiveFrom
  const effectiveTo =
    d.effectiveTo !== undefined ? parseEffectiveTo(d.effectiveTo) : existing.effectiveTo

  assertValidPeriodRange(effectiveFrom, effectiveTo)
  assertSingleOpenEndedOnUpdate(profiles, id, effectiveTo, d.effectiveTo === null)
  assertNoOverlap(profiles, effectiveFrom, effectiveTo, id)

  const updated = await prisma.incomeProfile.update({
    where: { id },
    data: buildUpdateData(d, effectiveFrom, effectiveTo),
  })

  await syncAppSettingsMirror(prisma, userId)
  return serializeIncomeProfile(updated)
}

export async function deleteIncomeProfile(prisma: PrismaClient, userId: string, id: string) {
  const existing = await prisma.incomeProfile.findFirst({ where: { id, userId } })
  if (!existing) throw new Error("Not found")
  await prisma.incomeProfile.delete({ where: { id } })
  await syncAppSettingsMirror(prisma, userId)
}
