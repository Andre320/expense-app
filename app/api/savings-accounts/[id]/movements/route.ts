import { NextResponse } from "next/server"
import { apiRequireUser, notFoundResponse } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import {
  applySavingsAccountMovement,
  listSavingsAccountMovements,
} from "@/lib/savings/services/movement.service"
import { errorResponse, validationErrorResponse } from "@/lib/shared/api-error"
import { savingsMovementCreateZ } from "@/lib/shared/validators"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  try {
    return NextResponse.json(await listSavingsAccountMovements(prisma, auth.userId, id))
  } catch {
    return notFoundResponse()
  }
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = savingsMovementCreateZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }
  try {
    const result = await applySavingsAccountMovement(prisma, auth.userId, id, parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Movement failed"
    const status = msg.includes("Insufficient") ? 400 : 404
    return errorResponse(msg, status)
  }
}
