import { describe, expect, it } from "vitest";
import {
  computeExpectedMonthlyIncomeBase,
  computeExpectedNetForMonth,
  computeIncomeProfileBreakdown,
} from "@/lib/income-profile";

const baseSettings = {
  crSalaryGross: 850_000,
  crSalaryCurrency: "CRC",
  crPayPeriod: "MONTHLY",
  crCrcPerUsd: 505,
  crSolidaristaPct: 0,
  crPensionComplementariaPct: 0,
  crEsppPct: 0,
};

const sampleBonus = {
  name: "Productivity",
  grossAmount: 500_000,
  grossCurrency: "CRC",
  months: "[3]",
};

describe("computeIncomeProfileBreakdown", () => {
  it("returns null when gross is zero", () => {
    expect(
      computeIncomeProfileBreakdown({ ...baseSettings, crSalaryGross: 0 }),
    ).toBeNull();
  });

  it("computes CRC breakdown for monthly gross", () => {
    const result = computeIncomeProfileBreakdown(baseSettings);
    expect(result).not.toBeNull();
    expect(result!.grossMonthlyCrc).toBe(850_000);
    expect(result!.netMonthlyCrc).toBeGreaterThan(0);
  });
});

describe("computeExpectedNetForMonth", () => {
  it("returns 0 when no salary profile", () => {
    expect(
      computeExpectedNetForMonth({ ...baseSettings, crSalaryGross: 0 }, [], 3)
        .expectedNetCrc,
    ).toBe(0);
  });

  it("returns salary-only net when no bonus in month", () => {
    const base = computeExpectedNetForMonth(baseSettings, [], 4);
    const withBonus = computeExpectedNetForMonth(baseSettings, [sampleBonus], 4);
    expect(withBonus.expectedNetCrc).toBe(base.expectedNetCrc);
    expect(withBonus.bonusGrossCrc).toBe(0);
  });

  it("increases net in bonus month but less than naive gross add (taxes apply)", () => {
    const base = computeExpectedNetForMonth(baseSettings, [], 3);
    const withBonus = computeExpectedNetForMonth(baseSettings, [sampleBonus], 3);
    expect(withBonus.bonusGrossCrc).toBe(500_000);
    expect(withBonus.expectedNetCrc).toBeGreaterThan(base.expectedNetCrc);
    expect(withBonus.expectedNetCrc - base.expectedNetCrc).toBeLessThan(500_000);
    expect(withBonus.activeBonuses).toHaveLength(1);
  });

  it("computeExpectedMonthlyIncomeBase uses current month", () => {
    const month = new Date().getMonth() + 1;
    const expected = computeExpectedNetForMonth(baseSettings, [sampleBonus], month);
    const fromHelper = computeExpectedMonthlyIncomeBase(baseSettings, [sampleBonus]);
    expect(fromHelper).toBe(expected.expectedNetCrc);
  });
});
