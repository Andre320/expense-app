import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { UseMutationResult } from "@tanstack/react-query"
import type { ComponentProps } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { toast } from "sonner"
import { ImportPdfTab, type BacPreviewRow } from "@/components/features/import/import-pdf-tab"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
}))

type BacParseData = { transactions: BacPreviewRow[]; warnings: string[]; pages: number }
type ImportData = { created: number; errors: string[] }

function mockMutation<TData, TVariables>(
  overrides: Partial<UseMutationResult<TData, Error, TVariables>> = {},
): UseMutationResult<TData, Error, TVariables> {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    data: undefined,
    error: null,
    failureCount: 0,
    failureReason: null,
    variables: undefined,
    context: undefined,
    submittedAt: 0,
    ...overrides,
  } as UseMutationResult<TData, Error, TVariables>
}

function renderTab(overrides: Partial<ComponentProps<typeof ImportPdfTab>> = {}) {
  const bacParseMut = overrides.bacParseMut ?? mockMutation<BacParseData, File>()
  const importMut = overrides.importMut ?? mockMutation<ImportData, object[]>()
  render(
    <ImportPdfTab
      bank="BAC"
      bacPreview={[]}
      bacWarnings={[]}
      pdfPages={0}
      bacParseMut={bacParseMut}
      importMut={importMut}
      {...overrides}
    />,
  )
  return { bacParseMut, importMut }
}

describe("ImportPdfTab", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it("shows persistent parser warnings under BAC upload", () => {
    renderTab({ bacWarnings: ["Skipped row 12: missing amount", "Unknown merchant on row 4"] })

    expect(screen.getByText("Parser warnings")).toBeInTheDocument()
    expect(screen.getByText("Skipped row 12: missing amount")).toBeInTheDocument()
    expect(screen.getByText("Unknown merchant on row 4")).toBeInTheDocument()
  })

  it("calls bacParseMut when a BAC PDF is selected", async () => {
    const user = userEvent.setup()
    const { bacParseMut } = renderTab()
    const file = new File(["pdf"], "statement.pdf", { type: "application/pdf" })

    await user.upload(screen.getByLabelText("Estado de cuenta (PDF)"), file)

    expect(bacParseMut.mutate).toHaveBeenCalledWith(file)
  })

  it("toasts parseApiError message when generic PDF upload fails", async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        text: async () => JSON.stringify({ error: "Could not read PDF" }),
      }),
    )
    renderTab()
    const file = new File(["pdf"], "other.pdf", { type: "application/pdf" })

    await user.upload(screen.getByLabelText("PDF file"), file)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Could not read PDF")
    })
  })
})
