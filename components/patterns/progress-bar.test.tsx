import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ProgressBar } from "@/components/patterns/progress-bar"

describe("ProgressBar", () => {
  it("clamps width between 0 and 100", () => {
    const { container, rerender } = render(<ProgressBar pct={150} />)
    expect(container.querySelector("[style]")).toHaveStyle({ width: "100%" })
    rerender(<ProgressBar pct={-10} />)
    expect(container.querySelector("[style]")).toHaveStyle({ width: "0%" })
  })

  it("renders at requested percent", () => {
    const { container } = render(<ProgressBar pct={42} />)
    expect(container.querySelector("[style]")).toHaveStyle({ width: "42%" })
  })
})
