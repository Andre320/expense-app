import { NextResponse } from "next/server"
import { apiRequireUser, notFoundResponse } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { deleteIncomeBonus, updateIncomeBonus } from "@/lib/income/services/income-bonus.service"
import { validationErrorResponse } from "@/lib/shared/api-error"
import { incomeBonusUpdateZ } from "@/lib/shared/validators"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = incomeBonusUpdateZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }
  try {
    const updated = await updateIncomeBonus(prisma, auth.userId, id, parsed.data)
    return NextResponse.json(updated)
  } catch {
    return notFoundResponse()
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  try {
    await deleteIncomeBonus(prisma, auth.userId, id)
  } catch {
    return notFoundResponse()
  }
  return new NextResponse(null, { status: 204 })
}
