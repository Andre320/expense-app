import { describe, expect, it } from "vitest"
import {
  rechartsTooltipContentStyle,
  rechartsTooltipItemStyle,
  rechartsTooltipLabelStyle,
} from "@/lib/stocks/chart-style"

describe("chart-style exports", () => {
  it("exposes tooltip style objects", () => {
    expect(rechartsTooltipContentStyle.opacity).toBe(1)
    expect(rechartsTooltipLabelStyle.fontWeight).toBe(600)
    expect(rechartsTooltipItemStyle.paddingTop).toBe(2)
  })
})
