import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { QueryErrorPanel } from "@/components/patterns/query-error-panel"

describe("QueryErrorPanel", () => {
  it("shows title and message", () => {
    render(<QueryErrorPanel title="Load failed" message="Network error" />)
    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(screen.getByText("Load failed")).toBeInTheDocument()
    expect(screen.getByText("Network error")).toBeInTheDocument()
  })

  it("calls onRetry when Try again is clicked", async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<QueryErrorPanel message="Oops" onRetry={onRetry} />)
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
