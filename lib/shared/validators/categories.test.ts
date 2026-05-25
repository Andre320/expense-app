import { describe, expect, it } from "vitest"
import { categoryCreateZ, categoryUpdateZ } from "@/lib/shared/validators/categories"

describe("categoryCreateZ", () => {
  it("accepts valid category", () => {
    const r = categoryCreateZ.safeParse({ name: "Food", kind: "EXPENSE" })
    expect(r.success).toBe(true)
  })

  it("rejects empty name", () => {
    expect(categoryCreateZ.safeParse({ name: "", kind: "EXPENSE" }).success).toBe(false)
  })
})

describe("categoryUpdateZ", () => {
  it("accepts partial patch", () => {
    expect(categoryUpdateZ.safeParse({ color: "#fff" }).success).toBe(true)
  })
})
