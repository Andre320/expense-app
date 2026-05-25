import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { listTags, upsertTag } from "@/lib/shared/services/tag.service"
import { z } from "zod"

const postZ = z.object({ name: z.string().min(1).max(64) })

export async function GET() {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response
  return NextResponse.json(await listTags(prisma, ctx.userId))
}

export async function POST(req: Request) {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response

  const json = await req.json().catch(() => null)
  const parsed = postZ.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const tag = await upsertTag(prisma, ctx.userId, parsed.data.name.trim())
  return NextResponse.json(tag)
}
