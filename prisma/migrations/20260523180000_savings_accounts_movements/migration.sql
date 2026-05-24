-- Savings accounts + movement history for goals and accounts.
PRAGMA foreign_keys=OFF;

CREATE TABLE "SavingsAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "balance" DECIMAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "SavingsAccountMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavingsAccountMovement_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SavingsAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SavingsAccountMovement_accountId_idx" ON "SavingsAccountMovement"("accountId");
CREATE INDEX "SavingsAccountMovement_occurredAt_idx" ON "SavingsAccountMovement"("occurredAt");

CREATE TABLE "SavingsGoalMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavingsGoalMovement_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "SavingsGoal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SavingsGoalMovement_goalId_idx" ON "SavingsGoalMovement"("goalId");
CREATE INDEX "SavingsGoalMovement_occurredAt_idx" ON "SavingsGoalMovement"("occurredAt");

PRAGMA foreign_keys=ON;
