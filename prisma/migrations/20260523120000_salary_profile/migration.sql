-- Replace draft forecast fields with persisted salary profile inputs.
-- If monthlyIncomeBase was set but no gross profile exists, seed default gross (850000 CRC monthly).
-- Gross cannot be reverse-engineered from net alone; users may re-save profile once after migration.
PRAGMA foreign_keys=OFF;

CREATE TABLE "AppSettings_new" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "quoteCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "quotePerBase" DECIMAL NOT NULL DEFAULT 1,
    "crSalaryGross" DECIMAL NOT NULL DEFAULT 0,
    "crSalaryCurrency" TEXT NOT NULL DEFAULT 'CRC',
    "crPayPeriod" TEXT NOT NULL DEFAULT 'MONTHLY',
    "crCrcPerUsd" DECIMAL NOT NULL DEFAULT 505,
    "crSolidaristaPct" DECIMAL NOT NULL DEFAULT 0,
    "crPensionComplementariaPct" DECIMAL NOT NULL DEFAULT 0,
    "crEsppPct" DECIMAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "AppSettings_new" (
    "id",
    "baseCurrency",
    "quoteCurrency",
    "quotePerBase",
    "crSalaryGross",
    "crSalaryCurrency",
    "crPayPeriod",
    "crCrcPerUsd",
    "crSolidaristaPct",
    "crPensionComplementariaPct",
    "crEsppPct",
    "updatedAt"
)
SELECT
    "id",
    "baseCurrency",
    "quoteCurrency",
    "quotePerBase",
    CASE WHEN "monthlyIncomeBase" > 0 THEN 850000 ELSE 0 END,
    'CRC',
    'MONTHLY',
    "crCrcPerUsd",
    "crSolidaristaPct",
    "crPensionComplementariaPct",
    "crEsppPct",
    "updatedAt"
FROM "AppSettings";

DROP TABLE "AppSettings";
ALTER TABLE "AppSettings_new" RENAME TO "AppSettings";

PRAGMA foreign_keys=ON;
