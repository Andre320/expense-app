import { NextResponse } from "next/server";
import { computeDualAmounts } from "@/lib/currency";
import { ensureAppDefaults, prisma } from "@/lib/db";
import { numFromDecimal } from "@/lib/utils";
import { csvImportZ } from "@/lib/validators";

export async function POST(req: Request) {
  await ensureAppDefaults();
  const json = await req.json().catch(() => null);
  const parsed = csvImportZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const settings = await prisma.appSettings.findUniqueOrThrow({
    where: { id: "default" },
  });
  const quotePerBase = numFromDecimal(settings.quotePerBase);

  let created = 0;
  const errors: string[] = [];

  for (let i = 0; i < parsed.data.rows.length; i++) {
    const row = parsed.data.rows[i]!;
    const occurredAt = new Date(row.occurredAt);
    if (Number.isNaN(occurredAt.getTime())) {
      errors.push(`Row ${i + 1}: invalid date`);
      continue;
    }

    let categoryId: string | null = null;
    if (row.categoryId?.trim()) {
      const byId = await prisma.category.findFirst({
        where: { id: row.categoryId.trim(), kind: row.kind },
      });
      categoryId = byId?.id ?? null;
    }
    if (!categoryId && row.categoryName?.trim()) {
      const cat = await prisma.category.findFirst({
        where: {
          name: { equals: row.categoryName.trim() },
          kind: row.kind,
        },
      });
      categoryId = cat?.id ?? null;
    }

    const dual = computeDualAmounts({
      amountOriginal: row.amountOriginal,
      currencyCode: row.currencyCode,
      baseCurrency: settings.baseCurrency,
      quoteCurrency: settings.quoteCurrency,
      quotePerBase,
    });

    await prisma.transaction.create({
      data: {
        occurredAt,
        kind: row.kind,
        description: row.description ?? "",
        categoryId,
        amountOriginal: String(row.amountOriginal),
        currencyCode: row.currencyCode.toUpperCase(),
        rateToBase: String(dual.rateToBase),
        amountBase: String(dual.amountBase),
        rateToQuote: String(dual.rateToQuote),
        amountQuote: String(dual.amountQuote),
      },
    });
    created++;
  }

  return NextResponse.json({ created, errors });
}
