import { SELECT_NONE } from "@/components/select-field"

export type StoreMappingCategory = { id: string; name: string; kind: string }

export function buildCategoryOptions(categories: StoreMappingCategory[]) {
  const expenseCats = categories.filter((c) => c.kind === "EXPENSE")
  return [
    { value: SELECT_NONE, label: "—" },
    ...expenseCats.map((c) => ({ value: c.id, label: c.name })),
  ]
}
