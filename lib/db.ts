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

  const defaults = [
    { name: "Salary", kind: "INCOME" as const, position: 1, color: "#22d3ee" },
    { name: "Freelance", kind: "INCOME" as const, position: 2, color: "#38bdf8" },
    { name: "Housing", kind: "EXPENSE" as const, position: 1, color: "#f472b6" },
    { name: "Food", kind: "EXPENSE" as const, position: 2, color: "#fb923c" },
    { name: "Transport", kind: "EXPENSE" as const, position: 3, color: "#a78bfa" },
    {
      name: "Subscriptions",
      kind: "EXPENSE" as const,
      position: 4,
      color: "#94a3b8",
    },
  ];

  for (const c of defaults) {
    await prisma.category.upsert({
      where: { name_kind: { name: c.name, kind: c.kind } },
      create: c,
      update: { position: c.position, color: c.color },
    });
  }
}
