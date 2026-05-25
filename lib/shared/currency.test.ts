import { describe, expect, it } from "vitest"
import { computeDualAmounts, normalizeCurrencyCode, roundMoney } from "@/lib/shared/currency"

describe("normalizeCurrencyCode", () => {
  it("defaults to CRC", () => {
    expect(normalizeCurrencyCode(null)).toBe("CRC")
  })

  it("accepts USD and CRC", () => {
    expect(normalizeCurrencyCode("usd")).toBe("USD")
    expect(normalizeCurrencyCode("CRC")).toBe("CRC")
  })

  it("falls back unknown codes to CRC", () => {
    expect(normalizeCurrencyCode("EUR")).toBe("CRC")
  })
})

describe("computeDualAmounts", () => {
  it("converts CRC amounts to USD quote", () => {
    const dual = computeDualAmounts({
      amountOriginal: 505000,
      currencyCode: "CRC",
      crcPerUsd: 505,
    })
    expect(dual.rateToBase).toBe(1)
    expect(dual.amountBase).toBe(505000)
    expect(dual.amountQuote).toBe(1000)
  })

  it("converts USD amounts to CRC base", () => {
    const dual = computeDualAmounts({
      amountOriginal: 100,
      currencyCode: "USD",
      crcPerUsd: 505,
    })
    expect(dual.rateToBase).toBe(505)
    expect(dual.amountBase).toBe(50500)
    expect(dual.amountQuote).toBe(100)
  })

  it("clamps tiny crcPerUsd to avoid division by zero", () => {
    const dual = computeDualAmounts({
      amountOriginal: 10,
      currencyCode: "CRC",
      crcPerUsd: 0,
    })
    expect(dual.rateToQuote).toBeGreaterThan(0)
    expect(Number.isFinite(dual.amountQuote)).toBe(true)
  })
})

describe("roundMoney", () => {
  it("rounds to two decimals", () => {
    expect(roundMoney(1.234)).toBe(1.23)
    expect(roundMoney(1.236)).toBe(1.24)
  })
})
