import "server-only";
import { PrismaClient } from "@/app/generated/prisma/client";
import { createSqliteAdapter } from "@/lib/prisma-adapter";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const adapter = createSqliteAdapter();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function ensureAppDefaults() {
  await prisma.appSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  await prisma.category.upsert({
    where: { name_kind: { name: "Uncategorized", kind: "EXPENSE" } },
    create: {
      name: "Uncategorized",
      kind: "EXPENSE",
      position: 99,
      color: "#71717a",
    },
    update: {},
  });
}
