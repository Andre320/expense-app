import { describe, expect, it } from "vitest"
import { z } from "zod"
import {
  DEFAULT_API_ERROR_MESSAGE,
  errorResponse,
  fetchJson,
  parseApiError,
  validationErrorResponse,
} from "@/lib/shared/api-error"
import { vi } from "vitest"

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("errorResponse", () => {
  it("returns JSON error with status", async () => {
    const res = errorResponse("Bad request", 400)
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: "Bad request" })
  })
})

describe("validationErrorResponse", () => {
  it("returns first field error as string", async () => {
    const parsed = z.object({ name: z.string().min(1, "Name is required") }).safeParse({ name: "" })
    if (parsed.success) throw new Error("expected validation failure")
    const res = validationErrorResponse(parsed.error)
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: "Name is required" })
  })

  it("includes fields map when requested", async () => {
    const parsed = z
      .object({ name: z.string().min(1, "Name is required"), kind: z.enum(["INCOME", "EXPENSE"]) })
      .safeParse({ name: "", kind: "BAD" })
    if (parsed.success) throw new Error("expected validation failure")
    const res = validationErrorResponse(parsed.error, { includeFields: true })
    const body = await res.json()
    expect(body.error).toBe("Name is required")
    expect(body.fields).toBeDefined()
  })

  it("uses form error when no field errors", async () => {
    const schema = z.object({ items: z.array(z.string()).min(1, "At least one item") })
    const parsed = schema.safeParse({ items: [] })
    if (parsed.success) throw new Error("expected validation failure")
    const res = validationErrorResponse(parsed.error)
    await expect(res.json()).resolves.toMatchObject({ error: expect.any(String) })
  })
})

describe("parseApiError", () => {
  it("parses 401 string error", async () => {
    const err = await parseApiError(jsonResponse({ error: "Unauthorized" }, 401))
    expect(err.message).toBe("Unauthorized")
  })

  it("parses 400 with string error", async () => {
    const err = await parseApiError(jsonResponse({ error: "Invalid input" }, 400))
    expect(err.message).toBe("Invalid input")
  })

  it("parses 400 with flatten object error", async () => {
    const err = await parseApiError(
      jsonResponse(
        {
          error: {
            formErrors: [],
            fieldErrors: { name: ["Required"] },
          },
        },
        400,
      ),
    )
    expect(err.message).toBe("Required")
  })

  it("falls back on 500 non-JSON body", async () => {
    const err = await parseApiError(
      new Response("<html>Internal Server Error</html>", {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }),
    )
    expect(err.message).toBe(DEFAULT_API_ERROR_MESSAGE)
  })

  it("falls back on empty body", async () => {
    const err = await parseApiError(new Response("", { status: 500 }))
    expect(err.message).toBe(DEFAULT_API_ERROR_MESSAGE)
  })

  it("falls back when JSON has no error key", async () => {
    const err = await parseApiError(jsonResponse({ ok: false }, 500))
    expect(err.message).toBe(DEFAULT_API_ERROR_MESSAGE)
  })

  it("parses formErrors from flatten object", async () => {
    const err = await parseApiError(
      jsonResponse({ error: { formErrors: ["Bad payload"], fieldErrors: {} } }, 400),
    )
    expect(err.message).toBe("Bad payload")
  })

  it("falls back when error object has no messages", async () => {
    const err = await parseApiError(
      jsonResponse({ error: { formErrors: [], fieldErrors: { name: [] } } }, 400),
    )
    expect(err.message).toBe(DEFAULT_API_ERROR_MESSAGE)
  })

  it("falls back when error is not a string or object", async () => {
    const err = await parseApiError(jsonResponse({ error: 42 }, 400))
    expect(err.message).toBe(DEFAULT_API_ERROR_MESSAGE)
  })
})

describe("fetchJson", () => {
  it("returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "1" }),
      }),
    )
    await expect(fetchJson<{ id: string }>("/api/x")).resolves.toEqual({ id: "1" })
    vi.unstubAllGlobals()
  })

  it("throws parseApiError on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        text: async () => JSON.stringify({ error: "Nope" }),
      }),
    )
    await expect(fetchJson("/api/x")).rejects.toThrow("Nope")
    vi.unstubAllGlobals()
  })
})
