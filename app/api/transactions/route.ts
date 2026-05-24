import { NextResponse } from "next/server";
import { computeDualAmounts } from "@/lib/currency";
import { ensureAppDefaults, prisma } from "@/lib/db";
import { serializeTransaction } from "@/lib/serialize";
import { numFromDecimal } from "@/lib/utils";
import { transactionCreateZ } from "@/lib/validators";
import type { Prisma } from "@/app/generated/prisma/client";

const sortable = new Set([
  "occurredAt",
  "amountBase",
  "kind",
  "description",
  "createdAt",
]);

export async function GET(req: Request) {
  await ensureAppDefaults();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? "20") || 20),
  );
  const kind = searchParams.get("kind");
  const q = searchParams.get("q")?.trim();
  const sortBy = searchParams.get("sortBy") ?? "occurredAt";
  const sortDir =
    searchParams.get("sortDir") === "asc" ? ("asc" as const) : ("desc" as const);
  const orderField = sortable.has(sortBy) ? sortBy : "occurredAt";

  const where: Prisma.TransactionWhereInput = {
    ...(kind === "INCOME" || kind === "EXPENSE" ? { kind } : {}),
    ...(q
      ? {
          OR: [
            { description: { contains: q } },
            { category: { name: { contains: q } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { [orderField]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    }),
  ]);

  return NextResponse.json({
    items: rows.map(serializeTransaction),
    total,
    page,
    pageSize,
  });
}

export async function POST(req: Request) {
  await ensureAppDefaults();
  const json = await req.json().catch(() => null);
  const parsed = transactionCreateZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const settings = await prisma.appSettings.findUniqueOrThrow({
    where: { id: "default" },
  });
  const crcPerUsd = numFromDecimal(settings.crCrcPerUsd);
  const dual = computeDualAmounts({
    amountOriginal: parsed.data.amountOriginal,
    currencyCode: parsed.data.currencyCode,
    crcPerUsd,
  });

  const occurredAt = new Date(parsed.data.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) {
    return NextResponse.json({ error: "Invalid occurredAt" }, { status: 400 });
  }

  const tagIds = parsed.data.tagIds ?? [];

  const created = await prisma.transaction.create({
    data: {
      occurredAt,
      kind: parsed.data.kind,
      description: parsed.data.description ?? "",
      categoryId: parsed.data.categoryId ?? null,
      amountOriginal: String(parsed.data.amountOriginal),
      currencyCode: parsed.data.currencyCode.toUpperCase(),
      rateToBase: String(dual.rateToBase),
      amountBase: String(dual.amountBase),
      rateToQuote: String(dual.rateToQuote),
      amountQuote: String(dual.amountQuote),
      tags: {
        create: tagIds.map((tagId) => ({
          tag: { connect: { id: tagId } },
        })),
      },
    },
    include: { category: true, tags: { include: { tag: true } } },
  });

  return NextResponse.json(serializeTransaction(created), { status: 201 });
}
