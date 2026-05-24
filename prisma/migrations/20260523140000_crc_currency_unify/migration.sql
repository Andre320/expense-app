-- Drop legacy workspace currency fields; CRC + crCrcPerUsd is the single exchange model.
PRAGMA foreign_keys=OFF;

CREATE TABLE "AppSettings_new" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
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
    "crSalaryGross",
    "crSalaryCurrency",
    "crPayPeriod",
    "crCrcPerUsd",
    "crSolidaristaPct",
    "crPensionComplementariaPct",
    "crEsppPct",
    "updatedAt"
FROM "AppSettings";

DROP TABLE "AppSettings";
ALTER TABLE "AppSettings_new" RENAME TO "AppSettings";

PRAGMA foreign_keys=ON;
