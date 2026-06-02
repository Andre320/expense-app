import { NextResponse } from "next/server"
import { apiRequireUser, notFoundResponse } from "@/lib/auth/api-context"
import { deleteCategory, updateCategory } from "@/lib/categories/services/category.service"
import { prisma } from "@/lib/db/client"
import { errorResponse, validationErrorResponse } from "@/lib/shared/api-error"
import { categoryUpdateZ } from "@/lib/shared/validators"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = categoryUpdateZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }

  try {
    const updated = await updateCategory(prisma, auth.userId, id, parsed.data)
    return NextResponse.json(updated)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed"
    if (msg === "Not found") return notFoundResponse()
    if (msg === "The Uncategorized category cannot be renamed or retyped") {
      return errorResponse(msg, 400)
    }
    return errorResponse("Update failed (duplicate name for this type?)", 409)
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  try {
    await deleteCategory(prisma, auth.userId, id)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Delete failed"
    if (msg === "Not found") return notFoundResponse()
    return errorResponse(msg, 400)
  }
  return new NextResponse(null, { status: 204 })
}
