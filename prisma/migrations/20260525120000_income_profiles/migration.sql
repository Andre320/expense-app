-- CreateTable
CREATE TABLE "IncomeProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Salary',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "crSalaryGross" DECIMAL(65,30) NOT NULL,
    "crSalaryCurrency" TEXT NOT NULL DEFAULT 'CRC',
    "crPayPeriod" TEXT NOT NULL DEFAULT 'MONTHLY',
    "crSolidaristaPct" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "crPensionComplementariaPct" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "crEsppPct" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IncomeProfile_userId_idx" ON "IncomeProfile"("userId");

-- CreateIndex
CREATE INDEX "IncomeProfile_userId_effectiveFrom_idx" ON "IncomeProfile"("userId", "effectiveFrom");

-- AddForeignKey
ALTER TABLE "IncomeProfile" ADD CONSTRAINT "IncomeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill one open-ended profile per user from AppSettings
INSERT INTO "IncomeProfile" (
    "id",
    "userId",
    "label",
    "effectiveFrom",
    "effectiveTo",
    "crSalaryGross",
    "crSalaryCurrency",
    "crPayPeriod",
    "crSolidaristaPct",
    "crPensionComplementariaPct",
    "crEsppPct",
    "position",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    s."userId",
    CASE WHEN s."crSalaryGross" > 0 THEN 'Salary' ELSE 'Salary (default)' END,
    u."createdAt",
    NULL,
    s."crSalaryGross",
    s."crSalaryCurrency",
    s."crPayPeriod",
    s."crSolidaristaPct",
    s."crPensionComplementariaPct",
    s."crEsppPct",
    1,
    NOW()
FROM "AppSettings" s
JOIN "User" u ON u."id" = s."userId"
WHERE NOT EXISTS (
    SELECT 1 FROM "IncomeProfile" p WHERE p."userId" = s."userId"
);
