import { NextResponse } from "next/server";
import { ensureAppDefaults, prisma } from "@/lib/db";
import { serializeSavings } from "@/lib/serialize";
import { savingsCreateZ } from "@/lib/validators";

export async function GET() {
  await ensureAppDefaults();
  const goals = await prisma.savingsGoal.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(goals.map(serializeSavings));
}

export async function POST(req: Request) {
  await ensureAppDefaults();
  const json = await req.json().catch(() => null);
  const parsed = savingsCreateZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const maxPos = await prisma.savingsGoal.aggregate({ _max: { position: true } });
  const position = (maxPos._max.position ?? 0) + 1;
  const created = await prisma.savingsGoal.create({
    data: {
      name: d.name,
      targetBase:
        d.targetBase == null ? null : String(d.targetBase),
      balanceBase: String(d.balanceBase ?? 0),
      color: d.color,
      notes: d.notes,
      position,
    },
  });
  return NextResponse.json(serializeSavings(created), { status: 201 });
}
