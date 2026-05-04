import { NextResponse } from "next/server";
import { ensureAppDefaults, prisma } from "@/lib/db";
import { categoryUpdateZ } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

const UNCATEGORIZED = { name: "Uncategorized", kind: "EXPENSE" as const };

export async function PATCH(req: Request, ctx: Ctx) {
  await ensureAppDefaults();
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = categoryUpdateZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    existing.name === UNCATEGORIZED.name &&
    existing.kind === UNCATEGORIZED.kind &&
    (parsed.data.name != null || parsed.data.kind != null)
  ) {
    return NextResponse.json(
      { error: "The Uncategorized category cannot be renamed or retyped" },
      { status: 400 },
    );
  }

  const name =
    parsed.data.name != null ? parsed.data.name.trim() : undefined;
  const kind = parsed.data.kind;

  try {
    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name != null && { name }),
        ...(kind != null && { kind }),
        ...(parsed.data.color !== undefined && { color: parsed.data.color }),
      },
    });
    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      kind: updated.kind,
      color: updated.color,
      position: updated.position,
    });
  } catch {
    return NextResponse.json(
      { error: "Update failed (duplicate name for this type?)" },
      { status: 409 },
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  await ensureAppDefaults();
  const { id } = await ctx.params;
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.name === UNCATEGORIZED.name && existing.kind === UNCATEGORIZED.kind) {
    return NextResponse.json(
      { error: "The Uncategorized category cannot be deleted" },
      { status: 400 },
    );
  }

  await prisma.category.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
