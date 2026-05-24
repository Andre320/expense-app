import { describe, expect, it } from "vitest";
import {
  applyTaxWithhold,
  buildVestSchedule,
  settleVestReceive,
  summarizePlan,
  valuePlan,
  vestDateForMonth,
} from "@/lib/rsu-vesting";

describe("buildVestSchedule", () => {
  it("generates 16 quarterly vests for 4 years", () => {
    const rows = buildVestSchedule({
      grantDate: new Date("2022-01-15T12:00:00"),
      totalShares: 100,
      vestingPeriodMonths: 48,
      vestIntervalMonths: 3,
      vestDayOfMonth: 20,
    });
    expect(rows).toHaveLength(16);
    expect(rows[0]!.sequence).toBe(1);
    expect(rows[0]!.scheduledDate.getDate()).toBe(20);
    const total = rows.reduce((s, r) => s + r.shares, 0);
    expect(total).toBe(100);
  });

  it("puts share remainder on last installment", () => {
    const rows = buildVestSchedule({
      grantDate: new Date("2022-01-01T12:00:00"),
      totalShares: 100,
      vestingPeriodMonths: 48,
      vestIntervalMonths: 3,
      vestDayOfMonth: 20,
    });
    expect(rows[15]!.shares).toBeGreaterThanOrEqual(rows[0]!.shares);
    expect(rows.reduce((s, r) => s + r.shares, 0)).toBe(100);
  });
});

describe("vestDateForMonth", () => {
  it("clamps day 31 to last day of February", () => {
    const d = vestDateForMonth(2026, 1, 31);
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(28);
  });
});

describe("applyTaxWithhold", () => {
  it("withholds 20% of shares", () => {
    const r = applyTaxWithhold(10, 20);
    expect(r.grossShares).toBe(10);
    expect(r.sharesWithheld).toBe(2);
    expect(r.netShares).toBe(8);
  });
});

describe("settleVestReceive", () => {
  it("floors net shares and pays fractional remainder as cash", () => {
    const r = settleVestReceive(6.25, 20, 100);
    expect(r.netSharesExact).toBe(5);
    expect(r.netWholeShares).toBe(5);
    expect(r.fractionalShares).toBe(0);
    expect(r.cashBonusUsd).toBe(0);
  });

  it("creates cash bonus when net shares have a fractional part", () => {
    const r = settleVestReceive(10, 22, 50);
    expect(r.netSharesExact).toBe(7.8);
    expect(r.netWholeShares).toBe(7);
    expect(r.fractionalShares).toBe(0.8);
    expect(r.cashBonusUsd).toBe(40);
  });
});

describe("summarizePlan", () => {
  const baseVests = buildVestSchedule({
    grantDate: new Date("2022-01-01T12:00:00"),
    totalShares: 100,
    vestingPeriodMonths: 48,
    vestIntervalMonths: 3,
    vestDayOfMonth: 20,
  }).map((r, i) => ({
    ...r,
    status: (i < 2 ? "RECEIVED" : "PENDING") as const,
    netShares: i < 2 ? applyTaxWithhold(r.shares, 20).netShares : null,
  }));

  it("computes received and remaining shares", () => {
    const s = summarizePlan({ totalShares: 100, ticker: "AAPL" }, baseVests);
    expect(s.sharesReceived).toBeGreaterThan(0);
    expect(s.sharesRemaining).toBeLessThan(100);
    expect(s.installmentsReceived).toBe(2);
  });
});

describe("valuePlan", () => {
  it("values received and pending at quote price", () => {
    const vests = [
      {
        sequence: 1,
        scheduledDate: new Date(),
        shares: 10,
        status: "RECEIVED" as const,
        netShares: 8,
        cashBonusUsd: 0,
      },
      {
        sequence: 2,
        scheduledDate: new Date(),
        shares: 10,
        status: "PENDING" as const,
        netShares: null,
      },
    ];
    const v = valuePlan(
      { totalShares: 100, ticker: "AAPL" },
      vests,
      { priceUsd: 100, asOf: new Date().toISOString() },
      20,
    );
    expect(v!.receivedGrossUsd).toBe(1000);
    expect(v!.receivedNetUsd).toBe(800);
    expect(v!.receivedCashBonusUsd).toBe(0);
    expect(v!.pendingGrossUsd).toBe(1000);
    expect(v!.totalGrantGrossUsd).toBe(10000);
  });
});
