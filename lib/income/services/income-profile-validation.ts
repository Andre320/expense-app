import "server-only"

import { startOfDay } from "date-fns"
import {
  findProfileOverlap,
  getCurrentOpenProfile,
  type IncomeProfileRow,
} from "@/lib/income/income-profile-period"

export class IncomeProfileValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "IncomeProfileValidationError"
  }
}

export function parseEffectiveFrom(iso: string): Date {
  return startOfDay(new Date(iso))
}

export function parseEffectiveTo(iso: string | null | undefined): Date | null {
  if (iso == null || iso === "") return null
  return startOfDay(new Date(iso))
}

export function assertValidPeriodRange(effectiveFrom: Date, effectiveTo: Date | null) {
  if (effectiveTo && effectiveTo < effectiveFrom) {
    throw new IncomeProfileValidationError("End date must be on or after start date")
  }
}

export function assertNoOverlap(
  profiles: IncomeProfileRow[],
  effectiveFrom: Date,
  effectiveTo: Date | null,
  excludeId?: string,
) {
  const err = findProfileOverlap(profiles, effectiveFrom, effectiveTo, excludeId)
  if (err) throw new IncomeProfileValidationError(err.message)
}

export function assertSingleOpenEndedOnCreate(
  profiles: IncomeProfileRow[],
  effectiveTo: Date | null,
) {
  if (effectiveTo !== null) return
  const open = getCurrentOpenProfile(profiles)
  if (open) {
    throw new IncomeProfileValidationError(
      `Close "${open.label}" with an end date before adding a new open-ended profile`,
    )
  }
}

export function assertSingleOpenEndedOnUpdate(
  profiles: IncomeProfileRow[],
  profileId: string,
  effectiveTo: Date | null,
  explicitNullEnd: boolean,
) {
  if (!explicitNullEnd || effectiveTo !== null) return
  const otherOpen = profiles.filter((p) => p.effectiveTo === null && p.id !== profileId)
  if (otherOpen.length > 0) {
    throw new IncomeProfileValidationError(
      `Only one open-ended profile allowed (close "${otherOpen[0]!.label}" first)`,
    )
  }
}
