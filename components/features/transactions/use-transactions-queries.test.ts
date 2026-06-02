import { describe, expect, it } from "vitest"
import { buildTxSearchParams } from "@/components/features/transactions/use-transactions-queries"

describe("buildTxSearchParams", () => {
  it("builds base pagination and sort params", () => {
    const params = buildTxSearchParams({
      page: 2,
      sortBy: "amountBase",
      sortDir: "asc",
    })
    expect(params.get("page")).toBe("2")
    expect(params.get("pageSize")).toBe("15")
    expect(params.get("sortBy")).toBe("amountBase")
    expect(params.get("sortDir")).toBe("asc")
    expect(params.has("kind")).toBe(false)
    expect(params.has("q")).toBe(false)
  })

  it("adds kind and search when provided", () => {
    const params = buildTxSearchParams({
      page: 1,
      sortBy: "occurredAt",
      sortDir: "desc",
      kindFilter: "EXPENSE",
      debouncedQ: "coffee",
    })
    expect(params.get("kind")).toBe("EXPENSE")
    expect(params.get("q")).toBe("coffee")
  })

  it("omits empty optional filters", () => {
    const params = buildTxSearchParams({
      page: 1,
      sortBy: "occurredAt",
      sortDir: "desc",
      kindFilter: "",
      debouncedQ: "",
    })
    expect(params.has("kind")).toBe(false)
    expect(params.has("q")).toBe(false)
  })
})
