import { NextResponse } from "next/server";
import { subMonths, startOfMonth, format } from "date-fns";
import { ensureAppDefaults, prisma } from "@/lib/db";
import { numFromDecimal } from "@/lib/utils";

export async function GET() {
  await ensureAppDefaults();
  const settings = await prisma.appSettings.findUniqueOrThrow({
    where: { id: "default" },
  });

  const since = startOfMonth(subMonths(new Date(), 11));
  const txs = await prisma.transaction.findMany({
    where: { occurredAt: { gte: since } },
    select: {
      occurredAt: true,
      kind: true,
      amountBase: true,
    },
  });

  const monthKeys: string[] = [];
  for (let i = 11; i >= 0; i--) {
    monthKeys.push(format(startOfMonth(subMonths(new Date(), i)), "yyyy-MM"));
  }

  const buckets = new Map<string, { income: number; expense: number }>();
  for (const k of monthKeys) {
    buckets.set(k, { income: 0, expense: 0 });
  }

  for (const t of txs) {
    const key = format(t.occurredAt, "yyyy-MM");
    if (!buckets.has(key)) continue;
    const b = buckets.get(key)!;
    const amt = numFromDecimal(t.amountBase);
    if (t.kind === "INCOME") b.income += amt;
    else b.expense += amt;
  }

  const monthly = monthKeys.map((month) => ({
    month,
    ...buckets.get(month)!,
  }));

  const last3 = monthly.slice(-3);
  const burnRate =
    last3.length > 0
      ? last3.reduce((s, m) => s + m.expense, 0) / last3.length
      : 0;

  const goals = await prisma.savingsGoal.findMany({
    select: { balanceBase: true },
  });
  const savingsTotal = goals.reduce(
    (s, g) => s + numFromDecimal(g.balanceBase),
    0,
  );

  return NextResponse.json({
    monthly,
    burnRate3Mo: Math.round(burnRate * 100) / 100,
    savingsTotal,
    settings: {
      baseCurrency: settings.baseCurrency,
      quoteCurrency: settings.quoteCurrency,
      quotePerBase: numFromDecimal(settings.quotePerBase),
      currentBalanceBase: numFromDecimal(settings.currentBalanceBase),
      monthlyIncomeBase: numFromDecimal(settings.monthlyIncomeBase),
      monthlyDeductionsBase: numFromDecimal(settings.monthlyDeductionsBase),
    },
  });
}
