import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

/**
 * Resolves `file:./dev.db` style URLs to an absolute path for better-sqlite3.
 */
export function createSqliteAdapter() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set");
  }
  const url = raw.startsWith("file:")
    ? path.join(
        /* turbopackIgnore: true */ process.cwd(),
        raw.slice("file:".length).replace(/^\.\//, ""),
      )
    : raw;
  return new PrismaBetterSqlite3({ url });
}
