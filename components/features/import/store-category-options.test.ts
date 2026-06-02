import { describe, expect, it } from "vitest"
import { SELECT_NONE } from "@/components/select-field"
import { buildCategoryOptions } from "@/components/features/import/store-category-options"

describe("buildCategoryOptions", () => {
  it("prepends none option and keeps only EXPENSE categories", () => {
    const options = buildCategoryOptions([
      { id: "e1", name: "Groceries", kind: "EXPENSE" },
      { id: "i1", name: "Salary", kind: "INCOME" },
      { id: "e2", name: "Transport", kind: "EXPENSE" },
    ])
    expect(options).toEqual([
      { value: SELECT_NONE, label: "—" },
      { value: "e1", label: "Groceries" },
      { value: "e2", label: "Transport" },
    ])
  })

  it("returns only the none option when no expense categories exist", () => {
    expect(buildCategoryOptions([{ id: "i1", name: "Salary", kind: "INCOME" }])).toEqual([
      { value: SELECT_NONE, label: "—" },
    ])
  })
})
