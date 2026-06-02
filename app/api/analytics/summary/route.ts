import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { getAnalyticsSummary } from "@/lib/income/services/analytics.service"
import { errorResponse } from "@/lib/shared/api-error"

export async function GET() {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response
  try {
    const payload = await getAnalyticsSummary(prisma, ctx.userId)
    return NextResponse.json(payload)
  } catch (e) {
    console.error("[GET /api/analytics/summary]", e)
    return errorResponse("Could not load summary", 500)
  }
}
