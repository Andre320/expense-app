import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { createCategory, listCategories } from "@/lib/categories/services/category.service"
import { prisma } from "@/lib/db/client"
import { categoryCreateZ } from "@/lib/shared/validators"

export async function GET() {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response
  return NextResponse.json(await listCategories(prisma, ctx.userId))
}

export async function POST(req: Request) {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response

  const json = await req.json().catch(() => null)
  const parsed = categoryCreateZ.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const created = await createCategory(prisma, ctx.userId, parsed.data)
    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "A category with this name and type already exists" },
      { status: 409 },
    )
  }
}
