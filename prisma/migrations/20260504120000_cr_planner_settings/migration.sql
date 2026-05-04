-- Redefine AppSettings with CR income planner fields (SQLite).
PRAGMA foreign_keys=OFF;

CREATE TABLE "AppSettings_new" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "quoteCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "quotePerBase" DECIMAL NOT NULL DEFAULT 1,
    "currentBalanceBase" DECIMAL NOT NULL DEFAULT 0,
    "monthlyIncomeBase" DECIMAL NOT NULL DEFAULT 0,
    "monthlyDeductionsBase" DECIMAL NOT NULL DEFAULT 0,
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
    "currentBalanceBase",
    "monthlyIncomeBase",
    "monthlyDeductionsBase",
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
    "currentBalanceBase",
    "monthlyIncomeBase",
    "monthlyDeductionsBase",
    505,
    0,
    0,
    0,
    "updatedAt"
FROM "AppSettings";

DROP TABLE "AppSettings";
ALTER TABLE "AppSettings_new" RENAME TO "AppSettings";

PRAGMA foreign_keys=ON;
