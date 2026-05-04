import { NextResponse } from "next/server";
import { ensureAppDefaults, prisma } from "@/lib/db";
import { createSavingsGoal, listSerializedSavingsGoals } from "@/lib/services/savings.service";
import { savingsCreateZ } from "@/lib/validators";

export async function GET() {
  await ensureAppDefaults();
  return NextResponse.json(await listSerializedSavingsGoals(prisma));
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
  const created = await createSavingsGoal(prisma, parsed.data);
  return NextResponse.json(created, { status: 201 });
}
