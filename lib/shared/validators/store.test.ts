import { describe, expect, it } from "vitest"
import { knownStoreCreateZ, knownStoreUpdateZ } from "@/lib/shared/validators/store"

describe("knownStoreCreateZ", () => {
  it("accepts valid mapping", () => {
    const r = knownStoreCreateZ.safeParse({
      pattern: "SUPER",
      displayName: "Groceries",
      categoryId: "cat-1",
    })
    expect(r.success).toBe(true)
  })

  it("rejects empty pattern", () => {
    expect(
      knownStoreCreateZ.safeParse({
        pattern: "",
        displayName: "X",
        categoryId: "cat-1",
      }).success,
    ).toBe(false)
  })
})

describe("knownStoreUpdateZ", () => {
  it("accepts partial patch", () => {
    expect(knownStoreUpdateZ.safeParse({ displayName: "Updated" }).success).toBe(true)
  })
})
