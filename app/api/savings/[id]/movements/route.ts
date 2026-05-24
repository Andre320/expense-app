import { NextResponse } from "next/server"
import { ensureAppDefaults, prisma } from "@/lib/db"
import {
  applySavingsGoalMovement,
  listSavingsGoalMovements,
} from "@/lib/services/savings-movement.service"
import { savingsMovementCreateZ } from "@/lib/validators"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  await ensureAppDefaults()
  const { id } = await ctx.params
  try {
    return NextResponse.json(await listSavingsGoalMovements(prisma, id))
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}

export async function POST(req: Request, ctx: Ctx) {
  await ensureAppDefaults()
  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = savingsMovementCreateZ.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const result = await applySavingsGoalMovement(prisma, id, parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Movement failed"
    const status = msg.includes("Insufficient") ? 400 : 404
    return NextResponse.json({ error: msg }, { status })
  }
}
