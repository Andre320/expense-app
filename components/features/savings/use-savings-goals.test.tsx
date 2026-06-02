import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useSortedGoals } from "@/components/features/savings/use-savings-goals"
import type { SavingsGoalDto } from "@/components/features/savings/use-savings-goals"

const goals: SavingsGoalDto[] = [
  {
    id: "2",
    name: "Zebra",
    currency: "CRC",
    targetAmount: 100,
    currentAmount: 0,
    priorityOrder: 2,
    color: null,
  },
  {
    id: "1",
    name: "Alpha",
    currency: "CRC",
    targetAmount: 100,
    currentAmount: 0,
    priorityOrder: 1,
    color: null,
  },
  {
    id: "3",
    name: "Beta",
    currency: "CRC",
    targetAmount: 100,
    currentAmount: 0,
    priorityOrder: 1,
    color: null,
  },
]

describe("useSortedGoals", () => {
  it("sorts by priority then name", () => {
    const { result } = renderHook(() => useSortedGoals(goals))
    expect(result.current.map((g) => g.name)).toEqual(["Alpha", "Beta", "Zebra"])
  })

  it("returns empty array when data is undefined", () => {
    const { result } = renderHook(() => useSortedGoals(undefined))
    expect(result.current).toEqual([])
  })
})
