import { describe, expect, it } from "vitest"
import type { IncomeBonusDto } from "@/components/features/income/income-bonus-types"
import {
  INCOME_BONUSES_QUERY_KEY,
  sortIncomeBonuses,
} from "@/components/features/income/income-bonuses-helpers"

const bonuses: IncomeBonusDto[] = [
  {
    id: "2",
    name: "Zebra",
    grossAmount: 100,
    grossCurrency: "CRC",
    months: [6],
    position: 2,
  },
  {
    id: "1",
    name: "Alpha",
    grossAmount: 200,
    grossCurrency: "CRC",
    months: [12],
    position: 1,
  },
  {
    id: "3",
    name: "Beta",
    grossAmount: 150,
    grossCurrency: "USD",
    months: [3],
    position: 1,
  },
]

describe("INCOME_BONUSES_QUERY_KEY", () => {
  it("uses stable list key", () => {
    expect(INCOME_BONUSES_QUERY_KEY).toEqual(["income-bonuses"])
  })
})

describe("sortIncomeBonuses", () => {
  it("sorts by position then name", () => {
    expect(sortIncomeBonuses(bonuses).map((b) => b.name)).toEqual(["Alpha", "Beta", "Zebra"])
  })

  it("returns empty array when data is undefined", () => {
    expect(sortIncomeBonuses(undefined)).toEqual([])
  })
})
