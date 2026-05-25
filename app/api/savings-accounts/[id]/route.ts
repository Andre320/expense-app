import { NextResponse } from "next/server"
import { apiRequireUser, notFoundResponse } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { deleteSavingsAccount, updateSavingsAccount } from "@/lib/savings/services/account.service"
import { savingsAccountUpdateZ } from "@/lib/shared/validators"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = savingsAccountUpdateZ.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const updated = await updateSavingsAccount(prisma, auth.userId, id, parsed.data)
    return NextResponse.json(updated)
  } catch {
    return notFoundResponse()
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  try {
    await deleteSavingsAccount(prisma, auth.userId, id)
  } catch {
    return notFoundResponse()
  }
  return new NextResponse(null, { status: 204 })
}
