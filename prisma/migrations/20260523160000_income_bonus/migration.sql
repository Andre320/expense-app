-- CreateTable
CREATE TABLE "IncomeBonus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "grossAmount" DECIMAL NOT NULL,
    "grossCurrency" TEXT NOT NULL DEFAULT 'CRC',
    "months" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
