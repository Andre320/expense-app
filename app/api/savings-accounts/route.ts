import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import {
  createSavingsAccount,
  listSerializedSavingsAccounts,
} from "@/lib/savings/services/account.service"
import { errorResponse, validationErrorResponse } from "@/lib/shared/api-error"
import { savingsAccountCreateZ } from "@/lib/shared/validators"

export async function GET() {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response
  try {
    return NextResponse.json(await listSerializedSavingsAccounts(prisma, ctx.userId))
  } catch (e) {
    console.error("[GET /api/savings-accounts]", e)
    return errorResponse("Could not load savings accounts", 500)
  }
}

export async function POST(req: Request) {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response

  const json = await req.json().catch(() => null)
  const parsed = savingsAccountCreateZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }
  try {
    const created = await createSavingsAccount(prisma, ctx.userId, parsed.data)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed"
    return errorResponse(msg, 400)
  }
}
