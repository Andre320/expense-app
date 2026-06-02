import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import {
  getSerializedSettings,
  patchSerializedSettings,
} from "@/lib/income/services/settings.service"
import { errorResponse, validationErrorResponse } from "@/lib/shared/api-error"
import { settingsPatchZ } from "@/lib/shared/validators"

export async function GET() {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response
  try {
    return NextResponse.json(await getSerializedSettings(prisma, ctx.userId))
  } catch (e) {
    console.error("[GET /api/settings]", e)
    return errorResponse("Could not load settings", 500)
  }
}

export async function PATCH(req: Request) {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response

  const json = await req.json().catch(() => null)
  const parsed = settingsPatchZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }
  const updated = await patchSerializedSettings(prisma, ctx.userId, parsed.data)
  return NextResponse.json(updated)
}
