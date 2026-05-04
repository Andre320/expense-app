import { NextResponse } from "next/server";
import { ensureAppDefaults, prisma } from "@/lib/db";
import { categoryCreateZ } from "@/lib/validators";

export async function GET() {
  await ensureAppDefaults();
  const categories = await prisma.category.findMany({
    orderBy: [{ kind: "asc" }, { position: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      kind: c.kind,
      color: c.color,
      position: c.position,
    })),
  );
}

export async function POST(req: Request) {
  await ensureAppDefaults();
  const json = await req.json().catch(() => null);
  const parsed = categoryCreateZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const name = parsed.data.name.trim();
  const maxPos = await prisma.category.aggregate({
    where: { kind: parsed.data.kind },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? 0) + 1;

  try {
    const created = await prisma.category.create({
      data: {
        name,
        kind: parsed.data.kind,
        color: parsed.data.color ?? "#6366f1",
        position,
      },
    });
    return NextResponse.json(
      {
        id: created.id,
        name: created.name,
        kind: created.kind,
        color: created.color,
        position: created.position,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "A category with this name and type already exists" },
      { status: 409 },
    );
  }
}
