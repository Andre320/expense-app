import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useTransactionQueries } from "@/components/features/transactions/use-transactions-queries"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe("useTransactionQueries debounced search", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("debounces q before transactions query includes search term", async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve({
        ok: true,
        json: async () =>
          String(url).startsWith("/api/transactions")
            ? { items: [], total: 0, page: 1, pageSize: 15 }
            : [],
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const { result } = renderHook(() => useTransactionQueries(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isPending).toBe(false))

    act(() => result.current.setQ("latte"))

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("q=latte"))).toBe(false)

    await waitFor(
      () => {
        expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("q=latte"))).toBe(true)
      },
      { timeout: 800 },
    )
  })
})
