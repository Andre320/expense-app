import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import {
  getSerializedSettings,
  patchSerializedSettings,
} from "@/lib/income/services/settings.service"
import { settingsPatchZ } from "@/lib/shared/validators"

export async function GET() {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response
  return NextResponse.json(await getSerializedSettings(prisma, ctx.userId))
}

export async function PATCH(req: Request) {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response

  const json = await req.json().catch(() => null)
  const parsed = settingsPatchZ.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const updated = await patchSerializedSettings(prisma, ctx.userId, parsed.data)
  return NextResponse.json(updated)
}
