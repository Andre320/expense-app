import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { MetricStat } from "@/components/patterns/metric-stat"

describe("MetricStat", () => {
  it("renders label and value", () => {
    render(<MetricStat label="Net income" value="₡1,250,000" />)
    expect(screen.getByText("Net income")).toBeInTheDocument()
    expect(screen.getByText("₡1,250,000")).toBeInTheDocument()
  })

  it("accepts React nodes as value", () => {
    render(<MetricStat label="Status" value={<span data-testid="badge">Active</span>} />)
    expect(screen.getByTestId("badge")).toHaveTextContent("Active")
  })
})
