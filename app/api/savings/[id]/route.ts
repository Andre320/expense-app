import { NextResponse } from "next/server"
import { apiRequireUser, notFoundResponse } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { serializeSavings } from "@/lib/shared/serialize"
import { applySavingsGoalMovement } from "@/lib/savings/services/movement.service"
import { numFromDecimal } from "@/lib/shared/utils"
import { savingsUpdateZ } from "@/lib/shared/validators"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = savingsUpdateZ.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const d = parsed.data
  try {
    const goal = await prisma.savingsGoal.findFirst({ where: { id, userId: auth.userId } })
    if (!goal) return notFoundResponse()

    if (d.currentAmount != null) {
      const current = numFromDecimal(goal.currentAmount)
      if (d.currentAmount !== current) {
        await applySavingsGoalMovement(prisma, auth.userId, id, {
          kind: "ADJUSTMENT",
          amount: d.currentAmount,
          description: "Balance correction",
        })
      }
    }

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: {
        ...(d.name != null && { name: d.name }),
        ...(d.targetAmount !== undefined && {
          targetAmount: d.targetAmount == null ? null : String(d.targetAmount),
        }),
        ...(d.priorityOrder !== undefined && { priorityOrder: d.priorityOrder }),
        ...(d.color !== undefined && { color: d.color }),
        ...(d.notes !== undefined && { notes: d.notes }),
      },
    })
    return NextResponse.json(serializeSavings(updated))
  } catch {
    return notFoundResponse()
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  const existing = await prisma.savingsGoal.findFirst({ where: { id, userId: auth.userId } })
  if (!existing) return notFoundResponse()

  await prisma.savingsGoal.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
