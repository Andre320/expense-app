import { vi } from "vitest"

vi.mock("@/lib/db/client", () => ({
  prisma: {},
}))
