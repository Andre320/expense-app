import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import {
  deleteIncomeProfile,
  IncomeProfileValidationError,
  updateIncomeProfile,
} from "@/lib/income/services/income-profile.service"
import { errorResponse, validationErrorResponse } from "@/lib/shared/api-error"
import { incomeProfileUpdateZ } from "@/lib/shared/validators"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, context: RouteContext) {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response

  const { id } = await context.params
  const json = await req.json().catch(() => null)
  const parsed = incomeProfileUpdateZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }

  try {
    const updated = await updateIncomeProfile(prisma, ctx.userId, id, parsed.data)
    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof IncomeProfileValidationError) {
      return errorResponse(e.message, 400)
    }
    if (e instanceof Error && e.message === "Not found") {
      return errorResponse("Not found", 404)
    }
    console.error("[PATCH /api/income-profiles/:id]", e)
    return errorResponse("Could not update income profile", 500)
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response

  const { id } = await context.params
  try {
    await deleteIncomeProfile(prisma, ctx.userId, id)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    if (e instanceof Error && e.message === "Not found") {
      return errorResponse("Not found", 404)
    }
    console.error("[DELETE /api/income-profiles/:id]", e)
    return errorResponse("Could not delete income profile", 500)
  }
}
