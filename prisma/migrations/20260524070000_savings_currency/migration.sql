-- Savings accounts and goals can hold balances in CRC or USD.
ALTER TABLE "SavingsGoal" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'CRC';
ALTER TABLE "SavingsAccount" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'CRC';
