import { describe, expect, it } from "vitest"
import { numFromDecimal } from "@/lib/shared/decimal"

describe("numFromDecimal", () => {
  it("returns 0 for nullish", () => {
    expect(numFromDecimal(null)).toBe(0)
    expect(numFromDecimal(undefined)).toBe(0)
  })

  it("passes through numbers", () => {
    expect(numFromDecimal(42)).toBe(42)
  })

  it("parses strings", () => {
    expect(numFromDecimal("123.45")).toBe(123.45)
  })

  it("parses decimal-like objects", () => {
    expect(numFromDecimal({ toString: () => "99.5" })).toBe(99.5)
  })
})
