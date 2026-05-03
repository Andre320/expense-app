import { NextResponse } from "next/server";
import { ensureAppDefaults, prisma } from "@/lib/db";

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
