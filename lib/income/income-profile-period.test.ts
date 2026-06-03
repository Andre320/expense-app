import { describe, expect, it } from "vitest"
import {
  findProfileOverlap,
  getProfileForMonth,
  hasSalaryProfile,
  isProfileActiveInMonth,
  plannedNetForCalendarMonth,
  getCurrentOpenProfile,
} from "@/lib/income/income-profile-period"

const baseProfile = {
  id: "p1",
  label: "2024",
  effectiveFrom: new Date("2024-01-01"),
  effectiveTo: new Date("2024-12-31"),
  crSalaryGross: 800_000,
  crSalaryCurrency: "CRC",
  crPayPeriod: "MONTHLY",
  crSolidaristaPct: 0,
  crPensionComplementariaPct: 0,
  crEsppPct: 0,
  position: 1,
}

const raisedProfile = {
  ...baseProfile,
  id: "p2",
  label: "2025",
  effectiveFrom: new Date("2025-01-01"),
  effectiveTo: null,
  crSalaryGross: 920_000,
}

describe("income-profile-period", () => {
  it("detects active month for bounded profile", () => {
    expect(isProfileActiveInMonth(baseProfile, "2024-06")).toBe(true)
    expect(isProfileActiveInMonth(baseProfile, "2025-01")).toBe(false)
  })

  it("picks profile for month by effectiveFrom", () => {
    const profiles = [baseProfile, raisedProfile]
    expect(getProfileForMonth(profiles, "2024-11")?.id).toBe("p1")
    expect(getProfileForMonth(profiles, "2025-03")?.id).toBe("p2")
  })

  it("computes planned net for month", () => {
    const net = plannedNetForCalendarMonth(baseProfile, 505, [], "2024-06")
    expect(net).toBeGreaterThan(0)
  })

  it("applies Solidarista/ESPP/taxes to older periods via deduction fallback", () => {
    const currentWithDeductions = {
      ...raisedProfile,
      crSolidaristaPct: 5,
      crPensionComplementariaPct: 2,
      crEsppPct: 10,
    }
    const profiles = [baseProfile, currentWithDeductions]
    const withoutFallback = plannedNetForCalendarMonth(
      baseProfile,
      505,
      [],
      "2024-06",
    )
    const withFallback = plannedNetForCalendarMonth(
      baseProfile,
      505,
      [],
      "2024-06",
      profiles,
      null,
    )
    expect(withFallback).toBeLessThan(withoutFallback)
    expect(withFallback).toBeGreaterThan(0)
  })

  it("reports overlap between intervals", () => {
    const err = findProfileOverlap([baseProfile], new Date("2024-06-01"), new Date("2025-06-01"))
    expect(err?.code).toBe("OVERLAP")
  })

  it("hasSalaryProfile returns false for zero gross", () => {
    expect(hasSalaryProfile([{ ...baseProfile, crSalaryGross: 0 }])).toBe(false)
  })

  it("getCurrentOpenProfile picks open period", () => {
    expect(getCurrentOpenProfile([baseProfile, raisedProfile])?.id).toBe("p2")
  })

  it("returns zero planned income without profile", () => {
    expect(plannedNetForCalendarMonth(null, 505, [], "2024-06")).toBe(0)
    expect(getProfileForMonth([], "2024-06")).toBeNull()
  })

  it("returns zero for invalid calendar month key", () => {
    expect(plannedNetForCalendarMonth(baseProfile, 505, [], "2024-13")).toBe(0)
  })

  it("findProfileOverlap returns null when no overlap", () => {
    expect(
      findProfileOverlap([baseProfile], new Date("2025-01-01"), new Date("2025-12-31")),
    ).toBeNull()
  })

  it("findProfileOverlap skips excluded profile id", () => {
    expect(
      findProfileOverlap([baseProfile], new Date("2024-06-01"), new Date("2024-12-31"), "p1"),
    ).toBeNull()
  })

  it("overlap message shows ongoing for open-ended profile", () => {
    const err = findProfileOverlap([raisedProfile], new Date("2025-06-01"), new Date("2025-12-31"))
    expect(err?.message).toContain("ongoing")
  })
})
