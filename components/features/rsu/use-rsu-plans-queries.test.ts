import { describe, expect, it, vi } from "vitest"
import { DEFAULT_API_ERROR_MESSAGE } from "@/lib/shared/api-error"
import {
  RSU_PLANS_QUERY_KEY,
  fetchPlanDetail,
  fetchPlans,
  rsuPlanDetailQueryKey,
} from "@/components/features/rsu/use-rsu-plans-queries"

function mockOkJson(data: unknown) {
  return {
    ok: true,
    text: async () => JSON.stringify(data),
    json: async () => data,
  }
}

function mockFail(error = DEFAULT_API_ERROR_MESSAGE) {
  return {
    ok: false,
    text: async () => JSON.stringify({ error }),
  }
}

describe("rsu plan query keys", () => {
  it("uses stable list key", () => {
    expect(RSU_PLANS_QUERY_KEY).toEqual(["rsu-plans"])
  })

  it("scopes detail key by plan id", () => {
    expect(rsuPlanDetailQueryKey("abc")).toEqual(["rsu-plans", "abc"])
  })
})

describe("fetchPlans", () => {
  it("returns plans JSON", async () => {
    const plans = [{ plan: { id: "p1" } }]
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockOkJson(plans)))
    await expect(fetchPlans()).resolves.toEqual(plans)
    vi.unstubAllGlobals()
  })

  it("throws parsed API error on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockFail("Could not load plans")))
    await expect(fetchPlans()).rejects.toThrow("Could not load plans")
    vi.unstubAllGlobals()
  })
})

describe("fetchPlanDetail", () => {
  it("fetches by id", async () => {
    const detail = { plan: { id: "x" }, vests: [] }
    const fetchMock = vi.fn().mockResolvedValue(mockOkJson(detail))
    vi.stubGlobal("fetch", fetchMock)
    await expect(fetchPlanDetail("x")).resolves.toEqual(detail)
    expect(fetchMock).toHaveBeenCalledWith("/api/rsu-plans/x", undefined)
    vi.unstubAllGlobals()
  })
})
