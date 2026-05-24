import { NextResponse } from "next/server"
import { ensureAppDefaults, prisma } from "@/lib/db"
import { receiveRsuVest, undoRsuVestReceive } from "@/lib/services/rsu-plan.service"
import { rsuVestReceiveZ } from "@/lib/validators"

type Ctx = { params: Promise<{ id: string; vestId: string }> }

export async function POST(req: Request, ctx: Ctx) {
  await ensureAppDefaults()
  const { id, vestId } = await ctx.params
  const json = await req.json().catch(() => ({}))
  const parsed = rsuVestReceiveZ.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const result = await receiveRsuVest(prisma, id, vestId, parsed.data.receivedAt)
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Receive failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function PATCH(_req: Request, ctx: Ctx) {
  await ensureAppDefaults()
  const { id, vestId } = await ctx.params
  try {
    const result = await undoRsuVestReceive(prisma, id, vestId)
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Undo failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
