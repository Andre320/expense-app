import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { parseStockRange } from "@/lib/stocks/range"
import { getStockHistory } from "@/lib/stocks/services/history.service"

type Ctx = { params: Promise<{ ticker: string }> }

export async function GET(req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { ticker } = await ctx.params
  const { searchParams } = new URL(req.url)
  const range = parseStockRange(searchParams.get("range"))
  const history = await getStockHistory(ticker, range)
  if (!history.available) {
    return NextResponse.json(history, { status: 503 })
  }
  return NextResponse.json(history)
}
