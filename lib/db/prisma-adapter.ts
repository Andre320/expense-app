import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

export function createPostgresAdapter() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }

  const pool = new pg.Pool({ connectionString })
  return new PrismaPg(pool)
}
