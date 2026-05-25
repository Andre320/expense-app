import "server-only"
import { PrismaClient } from "@/app/generated/prisma/client"
import { createPostgresAdapter } from "@/lib/db/prisma-adapter"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const adapter = createPostgresAdapter()

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
