import { NextResponse } from "next/server";
import { ensureAppDefaults, prisma } from "@/lib/db";
import {
  deleteRsuPlan,
  getRsuPlanDetail,
  updateRsuPlan,
} from "@/lib/services/rsu-plan.service";
import { rsuPlanUpdateZ } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  await ensureAppDefaults();
  const { id } = await ctx.params;
  try {
    return NextResponse.json(await getRsuPlanDetail(prisma, id));
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  await ensureAppDefaults();
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = rsuPlanUpdateZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(await updateRsuPlan(prisma, id, parsed.data));
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  await ensureAppDefaults();
  const { id } = await ctx.params;
  try {
    await deleteRsuPlan(prisma, id);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
