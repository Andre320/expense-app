import { NextResponse } from "next/server"
import { ensureAppDefaults, prisma } from "@/lib/db"
import { listRsuVests } from "@/lib/services/rsu-plan.service"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  await ensureAppDefaults()
  const { id } = await ctx.params
  try {
    return NextResponse.json(await listRsuVests(prisma, id))
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
