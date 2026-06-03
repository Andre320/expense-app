import type { IncomeProfileRow } from "@/lib/income/income-profile-period"
import type { IncomeProfileSettings } from "@/lib/income/profile"
import { numFromDecimal } from "@/lib/shared/decimal"

export type VoluntaryDeductionPct = {
  crSolidaristaPct: unknown
  crPensionComplementariaPct: unknown
  crEsppPct: unknown
}

export function voluntaryPctFromSource(source: VoluntaryDeductionPct) {
  return {
    solidaristaPct: numFromDecimal(source.crSolidaristaPct),
    pensionComplementariaPct: numFromDecimal(source.crPensionComplementariaPct),
    esppPct: numFromDecimal(source.crEsppPct),
  }
}

export function profileHasVoluntaryDeductions(profile: VoluntaryDeductionPct): boolean {
  return (
    numFromDecimal(profile.crSolidaristaPct) > 0 ||
    numFromDecimal(profile.crPensionComplementariaPct) > 0 ||
    numFromDecimal(profile.crEsppPct) > 0
  )
}

/** Prefer open-ended profile, then any profile with deductions, then app settings. */
export function pickDeductionFallback(
  profiles: IncomeProfileRow[],
  settings: VoluntaryDeductionPct | null,
): VoluntaryDeductionPct | null {
  const open = profiles.find((p) => p.effectiveTo === null)
  if (open && profileHasVoluntaryDeductions(open)) return open

  const withDeductions = profiles.find((p) => profileHasVoluntaryDeductions(p))
  if (withDeductions) return withDeductions

  if (settings && profileHasVoluntaryDeductions(settings)) return settings
  return open ?? settings
}

export function mergeProfileVoluntaryDeductions(
  profile: IncomeProfileRow,
  fallback: VoluntaryDeductionPct | null,
): IncomeProfileRow {
  if (!fallback || profileHasVoluntaryDeductions(profile)) return profile
  return {
    ...profile,
    crSolidaristaPct: fallback.crSolidaristaPct,
    crPensionComplementariaPct: fallback.crPensionComplementariaPct,
    crEsppPct: fallback.crEsppPct,
  }
}

export function profileToSettingsWithDeductions(
  profile: IncomeProfileRow,
  crcPerUsd: unknown,
  fallback: VoluntaryDeductionPct | null,
): IncomeProfileSettings {
  const merged = mergeProfileVoluntaryDeductions(profile, fallback)
  return {
    crSalaryGross: merged.crSalaryGross,
    crSalaryCurrency: merged.crSalaryCurrency,
    crPayPeriod: merged.crPayPeriod,
    crCrcPerUsd: crcPerUsd,
    crSolidaristaPct: merged.crSolidaristaPct,
    crPensionComplementariaPct: merged.crPensionComplementariaPct,
    crEsppPct: merged.crEsppPct,
  }
}

export function defaultVoluntaryDeductionsForCreate(
  d: Partial<{
    crSolidaristaPct?: number
    crPensionComplementariaPct?: number
    crEsppPct?: number
  }>,
  fallback: VoluntaryDeductionPct | null,
) {
  const fromFallback = fallback
    ? {
        crSolidaristaPct: numFromDecimal(fallback.crSolidaristaPct),
        crPensionComplementariaPct: numFromDecimal(fallback.crPensionComplementariaPct),
        crEsppPct: numFromDecimal(fallback.crEsppPct),
      }
    : { crSolidaristaPct: 0, crPensionComplementariaPct: 0, crEsppPct: 0 }

  return {
    crSolidaristaPct: d.crSolidaristaPct ?? fromFallback.crSolidaristaPct,
    crPensionComplementariaPct:
      d.crPensionComplementariaPct ?? fromFallback.crPensionComplementariaPct,
    crEsppPct: d.crEsppPct ?? fromFallback.crEsppPct,
  }
}
