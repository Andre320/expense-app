import { NextResponse } from "next/server";
import { ensureAppDefaults, prisma } from "@/lib/db";
import { serializeSavings } from "@/lib/serialize";
import { savingsUpdateZ } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  await ensureAppDefaults();
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = savingsUpdateZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;
  try {
    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: {
        ...(d.name != null && { name: d.name }),
        ...(d.targetAmount !== undefined && {
          targetAmount: d.targetAmount == null ? null : String(d.targetAmount),
        }),
        ...(d.currentAmount != null && { currentAmount: String(d.currentAmount) }),
        ...(d.priorityOrder !== undefined && { priorityOrder: d.priorityOrder }),
        ...(d.color !== undefined && { color: d.color }),
        ...(d.notes !== undefined && { notes: d.notes }),
      },
    });
    return NextResponse.json(serializeSavings(updated));
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  await ensureAppDefaults();
  const { id } = await ctx.params;
  try {
    await prisma.savingsGoal.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
