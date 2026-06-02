import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SELECT_NONE } from "@/components/select-field"
import { useStoreMappings } from "@/components/features/import/use-store-mappings"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe("useStoreMappings", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("loads categoryOptions with EXPENSE categories from fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url === "/api/categories") {
          return Promise.resolve({
            ok: true,
            json: async () => [
              { id: "e1", name: "Food", kind: "EXPENSE" },
              { id: "i1", name: "Paycheck", kind: "INCOME" },
            ],
          })
        }
        return Promise.resolve({ ok: true, json: async () => [] })
      }),
    )

    const { result } = renderHook(() => useStoreMappings(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.categoryOptions).toEqual([
        { value: SELECT_NONE, label: "—" },
        { value: "e1", label: "Food" },
      ])
    })
  })
})
