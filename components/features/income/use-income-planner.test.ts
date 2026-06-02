import { describe, expect, it, vi } from "vitest"
import { DEFAULT_API_ERROR_MESSAGE } from "@/lib/shared/api-error"
import { fmtCrc, fetchSettings } from "@/components/features/income/use-income-planner"

describe("fmtCrc", () => {
  it("formats CRC without decimals", () => {
    const formatted = fmtCrc(850_000)
    expect(formatted).toContain("₡")
    expect(formatted.replace(/\s/g, "")).toContain("850000")
  })
})

describe("fetchSettings", () => {
  it("returns JSON when response is ok", async () => {
    const settings = { crSalaryGross: 1 }
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => settings }))
    await expect(fetchSettings()).resolves.toEqual(settings)
    vi.unstubAllGlobals()
  })

  it("throws when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        text: async () => JSON.stringify({ error: "Could not load settings" }),
      }),
    )
    await expect(fetchSettings()).rejects.toThrow("Could not load settings")
    vi.unstubAllGlobals()
  })

  it("uses default message when error body is empty", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, text: async () => "" }))
    await expect(fetchSettings()).rejects.toThrow(DEFAULT_API_ERROR_MESSAGE)
    vi.unstubAllGlobals()
  })
})
