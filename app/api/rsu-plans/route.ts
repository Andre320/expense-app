import { NextResponse } from "next/server"
import { ensureAppDefaults, prisma } from "@/lib/db"
import { createRsuPlan, listRsuPlanSummaries } from "@/lib/services/rsu-plan.service"
import { rsuPlanCreateZ } from "@/lib/validators"

export async function GET() {
  await ensureAppDefaults()
  return NextResponse.json(await listRsuPlanSummaries(prisma))
}

export async function POST(req: Request) {
  await ensureAppDefaults()
  const json = await req.json().catch(() => null)
  const parsed = rsuPlanCreateZ.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const created = await createRsuPlan(prisma, parsed.data)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
