import bcrypt from "bcryptjs"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { PrismaClient } from "@/app/generated/prisma/client"
import { ensureUserDefaults } from "@/lib/auth/onboarding"
import { createCategory, updateCategory } from "@/lib/categories/services/category.service"
import { createPostgresAdapter } from "@/lib/db/prisma-adapter"
import {
  getSerializedSettings,
  patchSerializedSettings,
} from "@/lib/income/services/settings.service"
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/lib/transactions/services/transaction.service"

const databaseUrl = process.env.DATABASE_URL ?? ""
const isPostgres = /^postgres(ql)?:\/\//i.test(databaseUrl)

describe("tenant isolation", () => {
  let prisma: PrismaClient | undefined
  let skipSuite = !isPostgres

  let userAId: string
  let userBId: string
  let userBCategoryId: string
  let userBTransactionId: string

  beforeAll(async () => {
    if (skipSuite) return

    try {
      prisma = new PrismaClient({ adapter: createPostgresAdapter() })
      await prisma.$queryRaw`SELECT 1`
    } catch {
      skipSuite = true
      return
    }

    const passwordHash = await bcrypt.hash("test-password", 4)

    const userA = await prisma.user.create({
      data: {
        email: `tenant-a-${Date.now()}@example.com`,
        passwordHash,
      },
    })
    const userB = await prisma.user.create({
      data: {
        email: `tenant-b-${Date.now()}@example.com`,
        passwordHash,
      },
    })

    userAId = userA.id
    userBId = userB.id

    await ensureUserDefaults(userAId, prisma)
    await ensureUserDefaults(userBId, prisma)

    await patchSerializedSettings(prisma, userBId, { crSalaryGross: 2500000 })

    const category = await createCategory(prisma, userBId, {
      name: "Tenant B Food",
      kind: "EXPENSE",
    })
    userBCategoryId = category.id

    const tx = await createTransaction(prisma, userBId, {
      occurredAt: new Date("2026-05-01T00:00:00.000Z").toISOString(),
      kind: "EXPENSE",
      description: "Tenant B private tx",
      categoryId: userBCategoryId,
      amountOriginal: 1000,
      currencyCode: "CRC",
    })
    userBTransactionId = tx.id
  })

  afterAll(async () => {
    if (!prisma) return
    if (userAId) await prisma.user.delete({ where: { id: userAId } }).catch(() => {})
    if (userBId) await prisma.user.delete({ where: { id: userBId } }).catch(() => {})
    await prisma.$disconnect()
  })

  it("user A reads only their own settings", async ({ skip }) => {
    if (skipSuite || !prisma) {
      skip()
      return
    }

    const settingsA = await getSerializedSettings(prisma, userAId)
    const settingsB = await getSerializedSettings(prisma, userBId)

    expect(settingsA.crSalaryGross).toBe(0)
    expect(settingsB.crSalaryGross).toBe(2500000)
  })

  it("user A patch does not change user B settings", async ({ skip }) => {
    if (skipSuite || !prisma) {
      skip()
      return
    }

    await patchSerializedSettings(prisma, userAId, { crSalaryGross: 111111 })

    const settingsB = await getSerializedSettings(prisma, userBId)
    expect(settingsB.crSalaryGross).toBe(2500000)
  })

  it("user A cannot update user B category", async ({ skip }) => {
    if (skipSuite || !prisma) {
      skip()
      return
    }

    await expect(
      updateCategory(prisma, userAId, userBCategoryId, { name: "Hacked" }),
    ).rejects.toThrow("Not found")

    const still = await prisma.category.findFirst({
      where: { id: userBCategoryId, userId: userBId },
    })
    expect(still?.name).toBe("Tenant B Food")
  })

  it("user A cannot update user B transaction", async ({ skip }) => {
    if (skipSuite || !prisma) {
      skip()
      return
    }

    await expect(
      updateTransaction(prisma, userAId, userBTransactionId, { description: "Hacked" }),
    ).rejects.toThrow("Not found")
  })

  it("user A cannot delete user B transaction", async ({ skip }) => {
    if (skipSuite || !prisma) {
      skip()
      return
    }

    await expect(deleteTransaction(prisma, userAId, userBTransactionId)).rejects.toThrow(
      "Not found",
    )

    const still = await prisma.transaction.findFirst({
      where: { id: userBTransactionId, userId: userBId },
    })
    expect(still).not.toBeNull()
  })

  it("register flow creates user and default categories", async ({ skip }) => {
    if (skipSuite || !prisma) {
      skip()
      return
    }

    const email = `register-${Date.now()}@example.com`
    const passwordHash = await bcrypt.hash("register-password", 4)
    const user = await prisma.user.create({
      data: { email, passwordHash },
    })

    await ensureUserDefaults(user.id, prisma)

    const settings = await prisma.appSettings.findUnique({ where: { userId: user.id } })
    expect(settings).not.toBeNull()

    const categories = await prisma.category.findMany({ where: { userId: user.id } })
    expect(categories.map((c) => c.name).sort()).toEqual(
      [
        "Food",
        "Freelance",
        "Housing",
        "Salary",
        "Subscriptions",
        "Transport",
        "Uncategorized",
      ].sort(),
    )

    await prisma.user.delete({ where: { id: user.id } })
  })
})

if (!isPostgres) {
  it.skip("skips tenant isolation integration tests without postgres DATABASE_URL", () => {})
}
