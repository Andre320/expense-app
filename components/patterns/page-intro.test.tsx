import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PageIntro } from "@/components/patterns/page-intro"

describe("PageIntro", () => {
  it("renders title and optional eyebrow and description", () => {
    render(
      <PageIntro
        eyebrow="Finance"
        title="Income planner"
        description="Estimate take-home pay after deductions."
      />,
    )
    expect(screen.getByRole("heading", { level: 1, name: "Income planner" })).toBeInTheDocument()
    expect(screen.getByText("Finance")).toBeInTheDocument()
    expect(screen.getByText("Estimate take-home pay after deductions.")).toBeInTheDocument()
  })

  it("renders action slot when provided", () => {
    render(
      <PageIntro title="Transactions" actions={<button type="button">Add transaction</button>} />,
    )
    expect(screen.getByRole("button", { name: "Add transaction" })).toBeInTheDocument()
  })
})
