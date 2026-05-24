import { describe, expect, it } from "vitest"
import { buildTrendChart } from "@/lib/stock-trend"

describe("buildTrendChart", () => {
  it("projects upward for rising prices", () => {
    const bars = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
      close: 100 + i * 2,
    }))
    const { points, summary } = buildTrendChart(bars, 0.2)
    expect(summary).not.toBeNull()
    expect(summary!.projectedEnd).toBeGreaterThan(118)
    expect(summary!.projectedChangePct).toBeGreaterThan(0)
    expect(points.some((p) => p.kind === "forecast")).toBe(true)
  })

  it("returns null summary when too few bars", () => {
    const { summary } = buildTrendChart([{ date: "2026-01-01", close: 50 }])
    expect(summary).toBeNull()
  })
})
