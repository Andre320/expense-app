import { NextResponse } from "next/server"
import { apiRequireUser, notFoundResponse } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { deleteKnownStore, updateKnownStore } from "@/lib/store/services/known-store.service"
import { errorResponse, validationErrorResponse } from "@/lib/shared/api-error"
import { knownStoreUpdateZ } from "@/lib/shared/validators"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = knownStoreUpdateZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }

  try {
    const updated = await updateKnownStore(prisma, auth.userId, id, parsed.data)
    return NextResponse.json(updated)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed"
    if (msg === "Not found") return notFoundResponse()
    if (msg === "Category not found") {
      return errorResponse(msg, 400)
    }
    return errorResponse(msg, 409)
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  try {
    await deleteKnownStore(prisma, auth.userId, id)
  } catch {
    return notFoundResponse()
  }
  return new NextResponse(null, { status: 204 })
}
