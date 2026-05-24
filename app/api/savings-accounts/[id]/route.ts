import { NextResponse } from "next/server";
import { ensureAppDefaults, prisma } from "@/lib/db";
import {
  deleteSavingsAccount,
  updateSavingsAccount,
} from "@/lib/services/savings-account.service";
import { savingsAccountUpdateZ } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  await ensureAppDefaults();
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = savingsAccountUpdateZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  try {
    const updated = await updateSavingsAccount(prisma, id, parsed.data);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  await ensureAppDefaults();
  const { id } = await ctx.params;
  try {
    await deleteSavingsAccount(prisma, id);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
