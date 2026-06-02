import { NextResponse } from "next/server"
import { apiRequireUser, notFoundResponse } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { deleteRsuPlan, getRsuPlanDetail, updateRsuPlan } from "@/lib/rsu/services/plan.service"
import { validationErrorResponse } from "@/lib/shared/api-error"
import { rsuPlanUpdateZ } from "@/lib/shared/validators"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  try {
    return NextResponse.json(await getRsuPlanDetail(prisma, auth.userId, id))
  } catch {
    return notFoundResponse()
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = rsuPlanUpdateZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }
  try {
    return NextResponse.json(await updateRsuPlan(prisma, auth.userId, id, parsed.data))
  } catch {
    return notFoundResponse()
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  try {
    await deleteRsuPlan(prisma, auth.userId, id)
  } catch {
    return notFoundResponse()
  }
  return new NextResponse(null, { status: 204 })
}
