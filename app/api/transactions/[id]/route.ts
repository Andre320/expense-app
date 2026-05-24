import { NextResponse } from "next/server";
import { computeDualAmounts } from "@/lib/currency";
import { ensureAppDefaults, prisma } from "@/lib/db";
import { serializeTransaction } from "@/lib/serialize";
import { numFromDecimal } from "@/lib/utils";
import { transactionUpdateZ } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  await ensureAppDefaults();
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = transactionUpdateZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.transaction.findUnique({
    where: { id },
    include: { tags: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const settings = await prisma.appSettings.findUniqueOrThrow({
    where: { id: "default" },
  });
  const crcPerUsd = numFromDecimal(settings.crCrcPerUsd);

  const amountOriginal =
    parsed.data.amountOriginal ?? numFromDecimal(existing.amountOriginal);
  const currencyCode = (
    parsed.data.currencyCode ?? existing.currencyCode
  ).toUpperCase();

  const dual = computeDualAmounts({
    amountOriginal,
    currencyCode,
    crcPerUsd,
  });

  const occurredAt = parsed.data.occurredAt
    ? new Date(parsed.data.occurredAt)
    : existing.occurredAt;
  if (Number.isNaN(occurredAt.getTime())) {
    return NextResponse.json({ error: "Invalid occurredAt" }, { status: 400 });
  }

  const tagIds = parsed.data.tagIds;

  const updated = await prisma.$transaction(async (tx) => {
    if (tagIds) {
      await tx.transactionTag.deleteMany({ where: { transactionId: id } });
    }
    return tx.transaction.update({
      where: { id },
      data: {
        ...(parsed.data.kind != null && { kind: parsed.data.kind }),
        ...(parsed.data.description != null && {
          description: parsed.data.description,
        }),
        ...(parsed.data.categoryId !== undefined && {
          categoryId: parsed.data.categoryId,
        }),
        occurredAt,
        amountOriginal: String(amountOriginal),
        currencyCode,
        rateToBase: String(dual.rateToBase),
        amountBase: String(dual.amountBase),
        rateToQuote: String(dual.rateToQuote),
        amountQuote: String(dual.amountQuote),
        ...(tagIds != null && {
          tags: {
            create: tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          },
        }),
      },
      include: { category: true, tags: { include: { tag: true } } },
    });
  });

  return NextResponse.json(serializeTransaction(updated));
}

export async function DELETE(_req: Request, ctx: Ctx) {
  await ensureAppDefaults();
  const { id } = await ctx.params;
  try {
    await prisma.transaction.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
