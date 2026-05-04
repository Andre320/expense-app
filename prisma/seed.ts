import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { createSqliteAdapter } from "../lib/prisma-adapter";

const prisma = new PrismaClient({ adapter: createSqliteAdapter() });

async function main() {
  await prisma.appSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      baseCurrency: "USD",
      quoteCurrency: "EUR",
      quotePerBase: "0.92",
      currentBalanceBase: "12500",
      monthlyIncomeBase: "8200",
      monthlyDeductionsBase: "5400",
      crCrcPerUsd: "505",
      crSolidaristaPct: "0",
      crPensionComplementariaPct: "0",
      crEsppPct: "0",
    },
    update: {},
  });

  const defaults = [
    { name: "Salary", kind: "INCOME" as const, position: 1, color: "#22d3ee" },
    { name: "Freelance", kind: "INCOME" as const, position: 2, color: "#38bdf8" },
    { name: "Housing", kind: "EXPENSE" as const, position: 1, color: "#f472b6" },
    { name: "Food", kind: "EXPENSE" as const, position: 2, color: "#fb923c" },
    { name: "Transport", kind: "EXPENSE" as const, position: 3, color: "#a78bfa" },
    { name: "Subscriptions", kind: "EXPENSE" as const, position: 4, color: "#94a3b8" },
    {
      name: "Uncategorized",
      kind: "EXPENSE" as const,
      position: 99,
      color: "#71717a",
    },
  ];

  for (const c of defaults) {
    await prisma.category.upsert({
      where: { name_kind: { name: c.name, kind: c.kind } },
      create: c,
      update: { position: c.position, color: c.color },
    });
  }

  if ((await prisma.savingsGoal.count()) === 0) {
    await prisma.savingsGoal.create({
      data: {
        name: "Emergency fund",
        targetAmount: "20000",
        currentAmount: "8500",
        color: "#34d399",
        priorityOrder: 1,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
