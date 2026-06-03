-- Add dated bonus payment; migrate legacy month-list rows to paidOn + yearly repeat.
ALTER TABLE "IncomeBonus" ADD COLUMN "paidOn" DATE;
ALTER TABLE "IncomeBonus" ADD COLUMN "repeatsAnnually" BOOLEAN NOT NULL DEFAULT false;

UPDATE "IncomeBonus"
SET
  "paidOn" = make_date(
    EXTRACT(YEAR FROM "createdAt")::int,
    GREATEST(1, LEAST(12, COALESCE((("months"::json->>0)::int), 12))),
    1
  ),
  "repeatsAnnually" = true
WHERE "paidOn" IS NULL;

ALTER TABLE "IncomeBonus" ALTER COLUMN "paidOn" SET NOT NULL;
ALTER TABLE "IncomeBonus" DROP COLUMN "months";
