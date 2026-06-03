import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import {
  createIncomeProfile,
  IncomeProfileValidationError,
  listSerializedIncomeProfiles,
} from "@/lib/income/services/income-profile.service"
import { errorResponse, validationErrorResponse } from "@/lib/shared/api-error"
import { incomeProfileCreateZ } from "@/lib/shared/validators"

export async function GET() {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response
  try {
    return NextResponse.json(await listSerializedIncomeProfiles(prisma, ctx.userId))
  } catch (e) {
    console.error("[GET /api/income-profiles]", e)
    return errorResponse("Could not load income profiles", 500)
  }
}

export async function POST(req: Request) {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response

  const json = await req.json().catch(() => null)
  const parsed = incomeProfileCreateZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }

  try {
    const created = await createIncomeProfile(prisma, ctx.userId, parsed.data)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    if (e instanceof IncomeProfileValidationError) {
      return errorResponse(e.message, 400)
    }
    if (e instanceof Error && e.message === "Not found") {
      return errorResponse("Not found", 404)
    }
    console.error("[POST /api/income-profiles]", e)
    return errorResponse("Could not create income profile", 500)
  }
}
