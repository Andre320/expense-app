import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { BreakdownRow, PeriodToggle } from "@/components/features/income/planner-form.parts"

describe("BreakdownRow", () => {
  it("renders label, value, and optional hint", () => {
    render(<BreakdownRow label="CCSS (monthly)" value="₡45,000" hint="9.17% of gross" />)
    expect(screen.getByText("CCSS (monthly)")).toBeInTheDocument()
    expect(screen.getByText("₡45,000")).toBeInTheDocument()
    expect(screen.getByText("9.17% of gross")).toBeInTheDocument()
  })

  it("applies strong styling to net rows", () => {
    render(<BreakdownRow label="Net (monthly)" value="₡800,000" strong />)
    expect(screen.getByText("Net (monthly)")).toHaveClass("font-medium")
    expect(screen.getByText("₡800,000")).toHaveClass("font-semibold")
  })
})

describe("PeriodToggle", () => {
  it("highlights active period and calls onPeriodChange", async () => {
    const user = userEvent.setup()
    const onPeriodChange = vi.fn()
    render(<PeriodToggle period="MONTHLY" onPeriodChange={onPeriodChange} />)

    const monthly = screen.getByRole("button", { name: "Monthly" })
    const biweekly = screen.getByRole("button", { name: "Bi-weekly (quincenal)" })

    expect(monthly).toHaveAttribute("data-variant", "default")
    expect(biweekly).toHaveAttribute("data-variant", "outline")

    await user.click(biweekly)
    expect(onPeriodChange).toHaveBeenCalledWith("BIWEEKLY")
  })
})
