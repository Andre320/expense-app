import { NextResponse } from "next/server";
import { ensureAppDefaults, prisma } from "@/lib/db";
import { z } from "zod";

const postZ = z.object({ name: z.string().min(1).max(64) });

export async function GET() {
  await ensureAppDefaults();
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(tags.map((t) => ({ id: t.id, name: t.name })));
}

export async function POST(req: Request) {
  await ensureAppDefaults();
  const json = await req.json().catch(() => null);
  const parsed = postZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const name = parsed.data.name.trim();
  const tag = await prisma.tag.upsert({
    where: { name },
    create: { name },
    update: {},
  });
  return NextResponse.json({ id: tag.id, name: tag.name });
}
