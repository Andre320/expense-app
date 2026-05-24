import { describe, expect, it } from "vitest";
import { amountToReportingBase, normalizeCurrencyCode } from "@/lib/currency";
import {
  applyMovementToBalance,
  movementDelta,
  movementKindLabel,
} from "@/lib/savings-movement";

describe("normalizeCurrencyCode", () => {
  it("defaults missing currency to CRC", () => {
    expect(normalizeCurrencyCode(undefined)).toBe("CRC");
    expect(normalizeCurrencyCode(null)).toBe("CRC");
  });

  it("accepts USD", () => {
    expect(normalizeCurrencyCode("usd")).toBe("USD");
  });
});

describe("amountToReportingBase", () => {
  it("treats missing currency as CRC", () => {
    expect(amountToReportingBase(1000, undefined, 505)).toBe(1000);
  });
});

describe("applyMovementToBalance", () => {
  it("adds on deposit and initial", () => {
    expect(applyMovementToBalance(100, "DEPOSIT", 50)).toBe(150);
    expect(applyMovementToBalance(100, "INITIAL", 25)).toBe(125);
  });

  it("subtracts on withdrawal", () => {
    expect(applyMovementToBalance(100, "WITHDRAWAL", 40)).toBe(60);
  });

  it("rejects over-withdrawal", () => {
    expect(() => applyMovementToBalance(50, "WITHDRAWAL", 60)).toThrow(/Insufficient/);
  });

  it("sets absolute balance on adjustment", () => {
    expect(applyMovementToBalance(100, "ADJUSTMENT", 75)).toBe(75);
    expect(applyMovementToBalance(100, "ADJUSTMENT", 0)).toBe(0);
  });
});

describe("movementDelta", () => {
  it("returns signed change", () => {
    expect(movementDelta(100, "DEPOSIT", 25)).toBe(25);
    expect(movementDelta(100, "WITHDRAWAL", 30)).toBe(-30);
    expect(movementDelta(100, "ADJUSTMENT", 80)).toBe(-20);
  });
});

describe("movementKindLabel", () => {
  it("maps kinds to labels", () => {
    expect(movementKindLabel("DEPOSIT")).toBe("Deposit");
    expect(movementKindLabel("INITIAL")).toBe("Opening balance");
  });
});
