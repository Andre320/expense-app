import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { createKnownStore, listKnownStores } from "@/lib/store/services/known-store.service"
import { errorResponse, validationErrorResponse } from "@/lib/shared/api-error"
import { knownStoreCreateZ } from "@/lib/shared/validators"

export async function GET() {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response
  try {
    return NextResponse.json(await listKnownStores(prisma, ctx.userId))
  } catch (e) {
    console.error("[GET /api/known-stores]", e)
    return errorResponse("Could not load stores", 500)
  }
}

export async function POST(req: Request) {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response

  const json = await req.json().catch(() => null)
  const parsed = knownStoreCreateZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }

  try {
    const created = await createKnownStore(prisma, ctx.userId, parsed.data)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed"
    if (msg === "Category not found") {
      return errorResponse(msg, 400)
    }
    return errorResponse(msg, 409)
  }
}
