import { describe, expect, it } from "vitest"
import { formatMoneyBase } from "@/lib/shared/format-money"

describe("formatMoneyBase", () => {
  it("formats amount in given currency", () => {
    const formatted = formatMoneyBase(1500, "USD")
    expect(formatted).toContain("1,500")
    expect(formatted).toMatch(/\$|USD/)
  })
})
