import { describe, expect, it } from "vitest"
import { stockChangePct } from "@/components/features/stocks/stock-chart-header"

describe("stockChangePct", () => {
  it("returns percent change from first to last close", () => {
    expect(stockChangePct([{ close: 100 }, { close: 110 }])).toBeCloseTo(10, 5)
  })

  it("returns null for empty or invalid first close", () => {
    expect(stockChangePct([])).toBeNull()
    expect(stockChangePct([{ close: 0 }, { close: 10 }])).toBeNull()
  })
})
