import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  getSessionUserId,
  requireUserId,
  UnauthorizedError,
  unauthorizedResponse,
  withUser,
} from "@/lib/auth/require-user"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

import { auth } from "@/auth"

describe("require-user", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("getSessionUserId returns user id from session", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never)
    await expect(getSessionUserId()).resolves.toBe("user-1")
  })

  it("getSessionUserId returns null without session", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    await expect(getSessionUserId()).resolves.toBeNull()
  })

  it("requireUserId throws UnauthorizedError when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    await expect(requireUserId()).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it("requireUserId returns user id when authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-2" } } as never)
    await expect(requireUserId()).resolves.toBe("user-2")
  })

  it("unauthorizedResponse returns 401", async () => {
    const res = unauthorizedResponse()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "Unauthorized" })
  })

  it("withUser runs handler with user id", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-3" } } as never)
    const result = await withUser(async (userId) => ({ ok: userId }))
    expect(result).toEqual({ ok: "user-3" })
  })

  it("withUser returns unauthorized response on missing session", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const result = await withUser(async () => "should not run")
    expect(result).toBeInstanceOf(Response)
    expect((result as Response).status).toBe(401)
  })

  it("withUser rethrows non-auth errors", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-4" } } as never)
    await expect(
      withUser(async () => {
        throw new Error("boom")
      }),
    ).rejects.toThrow("boom")
  })
})
