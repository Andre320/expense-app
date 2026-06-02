import { NextResponse } from "next/server"
import { apiRequireUser, notFoundResponse } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { validationErrorResponse } from "@/lib/shared/api-error"
import { deleteSavingsGoal, updateSavingsGoal } from "@/lib/savings/services/goal.service"
import { savingsUpdateZ } from "@/lib/shared/validators"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = savingsUpdateZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }

  try {
    const updated = await updateSavingsGoal(prisma, auth.userId, id, parsed.data)
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
    await deleteSavingsGoal(prisma, auth.userId, id)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Delete failed"
    if (msg === "Not found") return notFoundResponse()
    throw e
  }
  return new NextResponse(null, { status: 204 })
}
