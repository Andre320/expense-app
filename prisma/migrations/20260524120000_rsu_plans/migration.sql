-- RSU grant plans and vest events
CREATE TABLE "RsuPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "totalShares" DECIMAL NOT NULL,
    "grantDate" DATETIME NOT NULL,
    "vestingPeriodMonths" INTEGER NOT NULL DEFAULT 48,
    "vestIntervalMonths" INTEGER NOT NULL DEFAULT 3,
    "vestDayOfMonth" INTEGER NOT NULL DEFAULT 20,
    "taxWithholdPct" DECIMAL NOT NULL DEFAULT 20,
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "RsuVest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "shares" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "receivedAt" DATETIME,
    "sharesWithheld" DECIMAL,
    "netShares" DECIMAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RsuVest_planId_fkey" FOREIGN KEY ("planId") REFERENCES "RsuPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RsuVest_planId_sequence_key" ON "RsuVest"("planId", "sequence");
CREATE INDEX "RsuVest_planId_idx" ON "RsuVest"("planId");
CREATE INDEX "RsuVest_scheduledDate_idx" ON "RsuVest"("scheduledDate");
