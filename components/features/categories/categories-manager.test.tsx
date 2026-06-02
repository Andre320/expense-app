import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { toast } from "sonner"
import { CategoriesManager } from "@/components/features/categories/categories-manager"
import { renderWithProviders } from "@/components/test/render"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
}))

describe("CategoriesManager", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it("toasts API error when creating a duplicate category", async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (url === "/api/categories" && init?.method !== "POST") {
          return Promise.resolve({ ok: true, json: async () => [] })
        }
        if (url === "/api/categories" && init?.method === "POST") {
          return Promise.resolve({
            ok: false,
            status: 409,
            text: async () =>
              JSON.stringify({ error: "A category with this name and type already exists" }),
          })
        }
        return Promise.resolve({ ok: true, json: async () => [] })
      }),
    )

    renderWithProviders(<CategoriesManager />)
    await user.type(screen.getByLabelText("Name"), "Groceries")
    await user.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("A category with this name and type already exists")
    })
  })
})
