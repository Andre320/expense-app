import { NextResponse } from "next/server";
import { ensureAppDefaults, prisma } from "@/lib/db";
import {
  createIncomeBonus,
  listSerializedIncomeBonuses,
} from "@/lib/services/income-bonus.service";
import { incomeBonusCreateZ } from "@/lib/validators";

export async function GET() {
  await ensureAppDefaults();
  return NextResponse.json(await listSerializedIncomeBonuses(prisma));
}

export async function POST(req: Request) {
  await ensureAppDefaults();
  const json = await req.json().catch(() => null);
  const parsed = incomeBonusCreateZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const created = await createIncomeBonus(prisma, parsed.data);
  return NextResponse.json(created, { status: 201 });
}
