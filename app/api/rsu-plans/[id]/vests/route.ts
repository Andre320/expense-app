import { NextResponse } from "next/server"
import { apiRequireUser, notFoundResponse } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { listRsuVests } from "@/lib/rsu/services/plan.service"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { id } = await ctx.params
  try {
    return NextResponse.json(await listRsuVests(prisma, auth.userId, id))
  } catch {
    return notFoundResponse()
  }
}
