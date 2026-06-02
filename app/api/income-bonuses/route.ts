import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import {
  createIncomeBonus,
  listSerializedIncomeBonuses,
} from "@/lib/income/services/income-bonus.service"
import { errorResponse, validationErrorResponse } from "@/lib/shared/api-error"
import { incomeBonusCreateZ } from "@/lib/shared/validators"

export async function GET() {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response
  try {
    return NextResponse.json(await listSerializedIncomeBonuses(prisma, ctx.userId))
  } catch (e) {
    console.error("[GET /api/income-bonuses]", e)
    return errorResponse("Could not load bonuses", 500)
  }
}

export async function POST(req: Request) {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response

  const json = await req.json().catch(() => null)
  const parsed = incomeBonusCreateZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }
  const created = await createIncomeBonus(prisma, ctx.userId, parsed.data)
  return NextResponse.json(created, { status: 201 })
}
