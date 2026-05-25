import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiRequireUser, notFoundResponse } from "@/lib/auth/api-context"

vi.mock("@/lib/auth/require-user", () => ({
  getSessionUserId: vi.fn(),
  unauthorizedResponse: vi.fn(() => Response.json({ error: "Unauthorized" }, { status: 401 })),
}))

vi.mock("@/lib/auth/onboarding", () => ({
  ensureUserDefaults: vi.fn(),
}))

import { getSessionUserId } from "@/lib/auth/require-user"
import { ensureUserDefaults } from "@/lib/auth/onboarding"

describe("apiRequireUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns unauthorized when no session", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null)

    const result = await apiRequireUser()

    expect(result.userId).toBeNull()
    expect(result.response?.status).toBe(401)
    expect(ensureUserDefaults).not.toHaveBeenCalled()
  })

  it("ensures defaults and returns userId when authenticated", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("user-1")

    const result = await apiRequireUser()

    expect(result.userId).toBe("user-1")
    expect(result.response).toBeNull()
    expect(ensureUserDefaults).toHaveBeenCalledWith("user-1")
  })
})

describe("notFoundResponse", () => {
  it("returns 404 JSON", async () => {
    const res = notFoundResponse("Missing")
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Missing" })
  })
})
