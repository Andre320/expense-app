import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { receiveRsuVest, undoRsuVestReceive } from "@/lib/rsu/services/plan.service"
import { errorResponse, validationErrorResponse } from "@/lib/shared/api-error"
import { rsuVestReceiveZ } from "@/lib/shared/validators"

type Ctx = { params: Promise<{ id: string; vestId: string }> }

export async function POST(req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id, vestId } = await ctx.params
  const json = await req.json().catch(() => ({}))
  const parsed = rsuVestReceiveZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }
  try {
    const result = await receiveRsuVest(prisma, auth.userId, id, vestId, parsed.data.receivedAt)
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Receive failed"
    return errorResponse(msg, 400)
  }
}

export async function PATCH(_req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id, vestId } = await ctx.params
  try {
    const result = await undoRsuVestReceive(prisma, auth.userId, id, vestId)
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Undo failed"
    return errorResponse(msg, 400)
  }
}
