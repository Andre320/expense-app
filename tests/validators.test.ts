import { describe, expect, it } from "vitest";
import {
  csvImportZ,
  settingsPatchZ,
  transactionCreateZ,
} from "@/lib/validators";

describe("csvImportZ", () => {
  it("accepts a minimal valid payload", () => {
    const r = csvImportZ.safeParse({
      rows: [
        {
          occurredAt: "2025-01-01T00:00:00.000Z",
          kind: "EXPENSE",
          amountOriginal: 10,
          currencyCode: "USD",
        },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty rows array", () => {
    const r = csvImportZ.safeParse({ rows: [] });
    expect(r.success).toBe(false);
  });

  it("rejects more than 5000 rows", () => {
    const r = csvImportZ.safeParse({
      rows: Array.from({ length: 5001 }, (_, i) => ({
        occurredAt: "2025-01-01T00:00:00.000Z",
        kind: "EXPENSE" as const,
        amountOriginal: 1,
        currencyCode: "USD",
      })),
    });
    expect(r.success).toBe(false);
  });

  it("rejects non-positive amount", () => {
    const r = csvImportZ.safeParse({
      rows: [
        {
          occurredAt: "2025-01-01T00:00:00.000Z",
          kind: "EXPENSE",
          amountOriginal: 0,
          currencyCode: "USD",
        },
      ],
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid currency code length", () => {
    const r = csvImportZ.safeParse({
      rows: [
        {
          occurredAt: "2025-01-01T00:00:00.000Z",
          kind: "EXPENSE",
          amountOriginal: 10,
          currencyCode: "US",
        },
      ],
    });
    expect(r.success).toBe(false);
  });
});

describe("transactionCreateZ", () => {
  it("accepts valid transaction", () => {
    const r = transactionCreateZ.safeParse({
      occurredAt: "2025-01-01T00:00:00.000Z",
      kind: "INCOME",
      amountOriginal: 100,
      currencyCode: "CRC",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.description).toBe("");
  });

  it("rejects empty occurredAt", () => {
    const r = transactionCreateZ.safeParse({
      occurredAt: "",
      kind: "EXPENSE",
      amountOriginal: 1,
      currencyCode: "USD",
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid kind", () => {
    const r = transactionCreateZ.safeParse({
      occurredAt: "2025-01-01T00:00:00.000Z",
      kind: "OTHER",
      amountOriginal: 1,
      currencyCode: "USD",
    });
    expect(r.success).toBe(false);
  });
});

describe("settingsPatchZ", () => {
  it("accepts empty patch", () => {
    expect(settingsPatchZ.safeParse({}).success).toBe(true);
  });

  it("accepts partial numeric fields", () => {
    const r = settingsPatchZ.safeParse({
      monthlyIncomeBase: 3000,
      crSolidaristaPct: 1.5,
    });
    expect(r.success).toBe(true);
  });

  it("rejects crCrcPerUsd that is not positive", () => {
    const r = settingsPatchZ.safeParse({ crCrcPerUsd: 0 });
    expect(r.success).toBe(false);
  });

  it("rejects pct out of range", () => {
    expect(settingsPatchZ.safeParse({ crEsppPct: 101 }).success).toBe(false);
    expect(settingsPatchZ.safeParse({ crEsppPct: -1 }).success).toBe(false);
  });

  it("rejects currency codes wrong length", () => {
    expect(settingsPatchZ.safeParse({ baseCurrency: "US" }).success).toBe(false);
  });
});
