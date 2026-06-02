import { NextResponse } from "next/server"
import { apiRequireUser, notFoundResponse } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { errorResponse, validationErrorResponse } from "@/lib/shared/api-error"
import { transactionUpdateZ } from "@/lib/shared/validators"
import {
  deleteTransaction,
  updateTransaction,
} from "@/lib/transactions/services/transaction.service"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = transactionUpdateZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }

  try {
    const updated = await updateTransaction(prisma, auth.userId, id, parsed.data)
    return NextResponse.json(updated)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed"
    if (msg === "Not found") return notFoundResponse()
    return errorResponse(msg, 400)
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  try {
    await deleteTransaction(prisma, auth.userId, id)
  } catch {
    return notFoundResponse()
  }
  return new NextResponse(null, { status: 204 })
}
