import { NextResponse } from "next/server"
import { ensureAppDefaults, prisma } from "@/lib/db"
import { getAnalyticsSummary } from "@/lib/services/analytics.service"

export async function GET() {
  await ensureAppDefaults()
  const payload = await getAnalyticsSummary(prisma)
  return NextResponse.json(payload)
}
