import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { listTags, upsertTag } from "@/lib/shared/services/tag.service"
import { errorResponse, validationErrorResponse } from "@/lib/shared/api-error"
import { z } from "zod"

const postZ = z.object({ name: z.string().min(1).max(64) })

export async function GET() {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response
  try {
    return NextResponse.json(await listTags(prisma, ctx.userId))
  } catch (e) {
    console.error("[GET /api/tags]", e)
    return errorResponse("Could not load tags", 500)
  }
}

export async function POST(req: Request) {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response

  const json = await req.json().catch(() => null)
  const parsed = postZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }
  const tag = await upsertTag(prisma, ctx.userId, parsed.data.name.trim())
  return NextResponse.json(tag)
}
