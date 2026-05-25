import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { createSavingsGoal, listSerializedSavingsGoals } from "@/lib/savings/services/goal.service"
import { savingsCreateZ } from "@/lib/shared/validators"

export async function GET() {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response
  return NextResponse.json(await listSerializedSavingsGoals(prisma, ctx.userId))
}

export async function POST(req: Request) {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response

  const json = await req.json().catch(() => null)
  const parsed = savingsCreateZ.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const created = await createSavingsGoal(prisma, ctx.userId, parsed.data)
  return NextResponse.json(created, { status: 201 })
}
