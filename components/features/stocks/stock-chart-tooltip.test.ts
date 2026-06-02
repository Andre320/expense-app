import { describe, expect, it } from "vitest"
import { formatAxisLabel } from "@/components/features/stocks/stock-chart-tooltip"

describe("formatAxisLabel", () => {
  it("includes time for day range", () => {
    const label = formatAxisLabel("2025-05-15T14:30:00.000Z", "day")
    expect(label.length).toBeGreaterThan(5)
    expect(label).toMatch(/\d/)
  })

  it("uses date-only style for month range", () => {
    const label = formatAxisLabel("2025-05-15T14:30:00.000Z", "month")
    expect(label).not.toMatch(/:\d{2}\s*(AM|PM|a\.?\s*m\.?)/i)
  })
})
