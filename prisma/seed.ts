import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaClient } from "../app/generated/prisma/client"
import { ensureUserDefaults } from "../lib/auth/onboarding"
import { createPostgresAdapter } from "../lib/db/prisma-adapter"

const prisma = new PrismaClient({ adapter: createPostgresAdapter() })

const DEMO_EMAIL = "demo@example.com"
const DEMO_PASSWORD = "demo-password-123"

async function seedUserData(userId: string) {
  await ensureUserDefaults(userId, prisma)

  await prisma.appSettings.update({
    where: { userId },
    data: {
      crSalaryGross: "850000",
      crSalaryCurrency: "CRC",
      crPayPeriod: "MONTHLY",
      crCrcPerUsd: "505",
      crSolidaristaPct: "0",
      crPensionComplementariaPct: "0",
      crEsppPct: "0",
    },
  })

  if ((await prisma.savingsGoal.count({ where: { userId } })) === 0) {
    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        name: "Emergency fund",
        targetAmount: "20000",
        currentAmount: "8500",
        color: "#34d399",
        priorityOrder: 1,
      },
    })
    await prisma.savingsGoalMovement.create({
      data: {
        goalId: goal.id,
        kind: "INITIAL",
        amount: "8500",
        description: "Already saved",
      },
    })
  }

  if ((await prisma.savingsAccount.count({ where: { userId } })) === 0) {
    const account = await prisma.savingsAccount.create({
      data: {
        userId,
        name: "Main savings",
        currency: "CRC",
        balance: "12000",
        position: 1,
      },
    })
    await prisma.savingsAccountMovement.create({
      data: {
        accountId: account.id,
        kind: "INITIAL",
        amount: "12000",
        description: "Opening balance",
      },
    })
  }

  if ((await prisma.incomeBonus.count({ where: { userId } })) === 0) {
    await prisma.incomeBonus.create({
      data: {
        userId,
        name: "Aguinaldo (example)",
        grossAmount: "200000",
        grossCurrency: "CRC",
        months: "[12]",
        position: 1,
      },
    })
  }

  if ((await prisma.rsuPlan.count({ where: { userId } })) === 0) {
    const { buildVestSchedule, settleVestReceive } = await import("../lib/rsu/vesting")
    const grantDate = new Date("2022-01-01T12:00:00")
    const exampleVestPriceUsd = 150
    const schedule = buildVestSchedule({
      grantDate,
      totalShares: 100,
      vestingPeriodMonths: 48,
      vestIntervalMonths: 3,
      vestDayOfMonth: 20,
    })

    const plan = await prisma.rsuPlan.create({
      data: {
        userId,
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
    })

    let grossReceived = 0
    const targetReceived = 16

    for (const row of schedule) {
      const receive = grossReceived < targetReceived
      let status: "PENDING" | "RECEIVED" = "PENDING"
      let receivedAt: Date | undefined
      let sharesWithheld: string | undefined
      let netShares: string | undefined
      let cashBonusUsd: string | undefined

      if (receive) {
        status = "RECEIVED"
        receivedAt = row.scheduledDate
        const settlement = settleVestReceive(row.shares, 20, exampleVestPriceUsd)
        sharesWithheld = String(settlement.sharesWithheld)
        netShares = String(settlement.netWholeShares)
        if (settlement.cashBonusUsd > 0) {
          cashBonusUsd = String(settlement.cashBonusUsd)
        }
        grossReceived += row.shares
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
      })
    }
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      email: DEMO_EMAIL,
      name: "Demo User",
      passwordHash,
    },
    update: {},
  })

  await seedUserData(user.id)
  console.log(`Seeded demo user ${DEMO_EMAIL} (password: ${DEMO_PASSWORD})`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
