import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { getAnalyticsSummary } from "@/lib/income/services/analytics.service"

export async function GET() {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response
  const payload = await getAnalyticsSummary(prisma, ctx.userId)
  return NextResponse.json(payload)
}
