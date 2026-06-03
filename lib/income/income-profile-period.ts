import { endOfDay, endOfMonth, parseISO, startOfDay, startOfMonth } from "date-fns"
import {
  pickDeductionFallback,
  profileToSettingsWithDeductions,
  type VoluntaryDeductionPct,
} from "@/lib/income/income-profile-deductions"
import { computeExpectedNetForMonth } from "@/lib/income/profile"
import type { IncomeBonusRow } from "@/lib/income/profile"
import { numFromDecimal } from "@/lib/shared/decimal"

export type IncomeProfileRow = {
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
}

export type IncomeProfileOverlapError = {
  code: "OVERLAP"
  message: string
}

function monthBounds(yyyyMm: string) {
  const d = parseISO(`${yyyyMm}-01`)
  return { start: startOfMonth(d), end: endOfMonth(d) }
}

/** Profile is active for any day in calendar month yyyy-MM. */
export function isProfileActiveInMonth(profile: IncomeProfileRow, yyyyMm: string): boolean {
  const { start: monthStart, end: monthEnd } = monthBounds(yyyyMm)
  const from = startOfDay(profile.effectiveFrom)
  const to = profile.effectiveTo ? endOfDay(profile.effectiveTo) : null
  return from <= monthEnd && (to === null || to >= monthStart)
}

/** Pick the profile that applies for a calendar month (latest effectiveFrom wins). */
export function getProfileForMonth(
  profiles: IncomeProfileRow[],
  yyyyMm: string,
): IncomeProfileRow | null {
  const active = profiles.filter((p) => isProfileActiveInMonth(p, yyyyMm))
  if (active.length === 0) return null
  return active.sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0]!
}

export function plannedNetForCalendarMonth(
  profile: IncomeProfileRow | null,
  crcPerUsd: unknown,
  bonuses: IncomeBonusRow[],
  yyyyMm: string,
  allProfiles: IncomeProfileRow[] = [],
  settingsFallback: VoluntaryDeductionPct | null = null,
): number {
  if (!profile) return 0
  const month = Number.parseInt(yyyyMm.slice(5, 7), 10)
  if (month < 1 || month > 12) return 0
  const deductionFallback = pickDeductionFallback(allProfiles, settingsFallback)
  const settings = profileToSettingsWithDeductions(profile, crcPerUsd, deductionFallback)
  return computeExpectedNetForMonth(settings, bonuses, yyyyMm).expectedNetCrc
}

export type { VoluntaryDeductionPct }

function intervalEnd(d: Date | null): Date {
  return d ? endOfDay(d) : new Date(8640000000000000)
}

function intervalsOverlap(aFrom: Date, aTo: Date | null, bFrom: Date, bTo: Date | null): boolean {
  const aStart = startOfDay(aFrom)
  const aEnd = intervalEnd(aTo)
  const bStart = startOfDay(bFrom)
  const bEnd = intervalEnd(bTo)
  return aStart <= bEnd && bStart <= aEnd
}

export function findProfileOverlap(
  profiles: IncomeProfileRow[],
  effectiveFrom: Date,
  effectiveTo: Date | null,
  excludeId?: string,
): IncomeProfileOverlapError | null {
  for (const p of profiles) {
    if (excludeId && p.id === excludeId) continue
    if (intervalsOverlap(effectiveFrom, effectiveTo, p.effectiveFrom, p.effectiveTo)) {
      return {
        code: "OVERLAP",
        message: `Overlaps with profile "${p.label}" (${p.effectiveFrom.toISOString().slice(0, 10)} – ${
          p.effectiveTo ? p.effectiveTo.toISOString().slice(0, 10) : "ongoing"
        })`,
      }
    }
  }
  return null
}

export function hasSalaryProfile(profiles: IncomeProfileRow[]): boolean {
  return profiles.some((p) => numFromDecimal(p.crSalaryGross) > 0)
}

export function getCurrentOpenProfile(profiles: IncomeProfileRow[]): IncomeProfileRow | null {
  const open = profiles.filter((p) => p.effectiveTo === null)
  if (open.length === 0) return null
  return open.sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0]!
}
