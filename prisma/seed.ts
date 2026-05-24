import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { createSqliteAdapter } from "../lib/prisma-adapter";

const prisma = new PrismaClient({ adapter: createSqliteAdapter() });

async function main() {
  await prisma.appSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      crSalaryGross: "850000",
      crSalaryCurrency: "CRC",
      crPayPeriod: "MONTHLY",
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
    const goal = await prisma.savingsGoal.create({
      data: {
        name: "Emergency fund",
        targetAmount: "20000",
        currentAmount: "8500",
        color: "#34d399",
        priorityOrder: 1,
      },
    });
    await prisma.savingsGoalMovement.create({
      data: {
        goalId: goal.id,
        kind: "INITIAL",
        amount: "8500",
        description: "Already saved",
      },
    });
  }

  if ((await prisma.savingsAccount.count()) === 0) {
    const account = await prisma.savingsAccount.create({
      data: {
        name: "Main savings",
        currency: "CRC",
        balance: "12000",
        position: 1,
      },
    });
    await prisma.savingsAccountMovement.create({
      data: {
        accountId: account.id,
        kind: "INITIAL",
        amount: "12000",
        description: "Opening balance",
      },
    });
  }

  if ((await prisma.incomeBonus.count()) === 0) {
    await prisma.incomeBonus.create({
      data: {
        name: "Aguinaldo (example)",
        grossAmount: "200000",
        grossCurrency: "CRC",
        months: "[12]",
        position: 1,
      },
    });
  }

  if ((await prisma.rsuPlan.count()) === 0) {
    const { buildVestSchedule, settleVestReceive } = await import("../lib/rsu-vesting");
    const grantDate = new Date("2022-01-01T12:00:00");
    const exampleVestPriceUsd = 150;
    const schedule = buildVestSchedule({
      grantDate,
      totalShares: 100,
      vestingPeriodMonths: 48,
      vestIntervalMonths: 3,
      vestDayOfMonth: 20,
    });

    const plan = await prisma.rsuPlan.create({
      data: {
        name: "Plan 1 (example)",
        ticker: "SNOW",
        totalShares: "100",
        grantDate,
        vestingPeriodMonths: 48,
        vestIntervalMonths: 3,
        vestDayOfMonth: 20,
        taxWithholdPct: "20",
        position: 1,
      },
    });

    let grossReceived = 0;
    const targetReceived = 16;

    for (const row of schedule) {
      const receive = grossReceived < targetReceived;
      let status: "PENDING" | "RECEIVED" = "PENDING";
      let receivedAt: Date | undefined;
      let sharesWithheld: string | undefined;
      let netShares: string | undefined;
      let cashBonusUsd: string | undefined;

      if (receive) {
        status = "RECEIVED";
        receivedAt = row.scheduledDate;
        const settlement = settleVestReceive(row.shares, 20, exampleVestPriceUsd);
        sharesWithheld = String(settlement.sharesWithheld);
        netShares = String(settlement.netWholeShares);
        if (settlement.cashBonusUsd > 0) {
          cashBonusUsd = String(settlement.cashBonusUsd);
        }
        grossReceived += row.shares;
      }

      await prisma.rsuVest.create({
        data: {
          planId: plan.id,
          sequence: row.sequence,
          scheduledDate: row.scheduledDate,
          shares: String(row.shares),
          status,
          receivedAt,
          sharesWithheld,
          netShares,
          cashBonusUsd,
        },
      });
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
