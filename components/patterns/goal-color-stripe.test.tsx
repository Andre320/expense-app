import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { GoalColorStripe } from "@/components/patterns/goal-color-stripe"

describe("GoalColorStripe", () => {
  it("uses provided hex color", () => {
    const { container } = render(<GoalColorStripe color="#ff5500" />)
    expect(container.firstChild).toHaveStyle({ background: "#ff5500" })
  })

  it("falls back to chart variable when color is null", () => {
    const { container } = render(<GoalColorStripe color={null} />)
    expect(container.firstChild).toHaveStyle({ background: "var(--chart-savings)" })
  })

  it("accepts custom fallback variable", () => {
    const { container } = render(<GoalColorStripe color={null} fallbackVar="var(--chart-income)" />)
    expect(container.firstChild).toHaveStyle({ background: "var(--chart-income)" })
  })
})
