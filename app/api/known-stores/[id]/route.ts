import { NextResponse } from "next/server";
import { ensureAppDefaults, prisma } from "@/lib/db";
import { knownStoreUpdateZ } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  await ensureAppDefaults();
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = knownStoreUpdateZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.categoryId) {
    const cat = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId },
    });
    if (!cat) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }
  }

  if (parsed.data.pattern) {
    const patternNorm = parsed.data.pattern.trim().toLowerCase();
    const all = await prisma.knownStore.findMany({
      where: { id: { not: id } },
      select: { pattern: true },
    });
    if (all.some((s) => s.pattern.toLowerCase() === patternNorm)) {
      return NextResponse.json(
        { error: "Another mapping already uses this pattern" },
        { status: 409 },
      );
    }
  }

  try {
    const updated = await prisma.knownStore.update({
      where: { id },
      data: {
        ...(parsed.data.pattern != null && {
          pattern: parsed.data.pattern.trim(),
        }),
        ...(parsed.data.displayName != null && {
          displayName: parsed.data.displayName.trim(),
        }),
        ...(parsed.data.categoryId != null && {
          categoryId: parsed.data.categoryId,
        }),
      },
      include: { category: { select: { id: true, name: true, kind: true } } },
    });
    return NextResponse.json({
      id: updated.id,
      pattern: updated.pattern,
      displayName: updated.displayName,
      categoryId: updated.categoryId,
      categoryName: updated.category.name,
      position: updated.position,
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  await ensureAppDefaults();
  const { id } = await ctx.params;
  try {
    await prisma.knownStore.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
