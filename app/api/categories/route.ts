import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { createCategory, listCategories } from "@/lib/categories/services/category.service"
import { prisma } from "@/lib/db/client"
import { errorResponse, validationErrorResponse } from "@/lib/shared/api-error"
import { categoryCreateZ } from "@/lib/shared/validators"

export async function GET() {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response
  try {
    return NextResponse.json(await listCategories(prisma, ctx.userId))
  } catch (e) {
    console.error("[GET /api/categories]", e)
    return errorResponse("Could not load categories", 500)
  }
}

export async function POST(req: Request) {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response

  const json = await req.json().catch(() => null)
  const parsed = categoryCreateZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }

  try {
    const created = await createCategory(prisma, ctx.userId, parsed.data)
    return NextResponse.json(created, { status: 201 })
  } catch {
    return errorResponse("A category with this name and type already exists", 409)
  }
}
