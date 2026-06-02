import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { createSavingsGoal, listSerializedSavingsGoals } from "@/lib/savings/services/goal.service"
import { errorResponse, validationErrorResponse } from "@/lib/shared/api-error"
import { savingsCreateZ } from "@/lib/shared/validators"

export async function GET() {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response
  try {
    return NextResponse.json(await listSerializedSavingsGoals(prisma, ctx.userId))
  } catch (e) {
    console.error("[GET /api/savings]", e)
    return errorResponse("Could not load savings goals", 500)
  }
}

export async function POST(req: Request) {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response

  const json = await req.json().catch(() => null)
  const parsed = savingsCreateZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }
  const created = await createSavingsGoal(prisma, ctx.userId, parsed.data)
  return NextResponse.json(created, { status: 201 })
}
