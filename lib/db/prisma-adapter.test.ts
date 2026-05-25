import { afterEach, describe, expect, it, vi } from "vitest"

const poolMock = vi.fn()
const adapterMock = vi.fn()

vi.mock("pg", () => ({
  default: {
    Pool: poolMock,
  },
}))

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: adapterMock,
}))

describe("createPostgresAdapter", () => {
  const prevUrl = process.env.DATABASE_URL

  afterEach(() => {
    vi.resetModules()
    poolMock.mockReset()
    adapterMock.mockReset()
    if (prevUrl) process.env.DATABASE_URL = prevUrl
    else delete process.env.DATABASE_URL
  })

  it("throws when DATABASE_URL is unset", async () => {
    delete process.env.DATABASE_URL
    const { createPostgresAdapter } = await import("@/lib/db/prisma-adapter")
    expect(() => createPostgresAdapter()).toThrow("DATABASE_URL is not set")
  })

  it("creates pool and adapter when DATABASE_URL is set", async () => {
    process.env.DATABASE_URL = "postgresql://expense:expense@localhost:5432/expense_app"
    poolMock.mockImplementation(function Pool() {
      return {}
    })
    adapterMock.mockImplementation(function PrismaPg() {
      return { kind: "adapter" }
    })

    const { createPostgresAdapter } = await import("@/lib/db/prisma-adapter")
    const adapter = createPostgresAdapter()

    expect(poolMock).toHaveBeenCalledWith({
      connectionString: process.env.DATABASE_URL,
    })
    expect(adapterMock).toHaveBeenCalled()
    expect(adapter).toEqual({ kind: "adapter" })
  })
})
