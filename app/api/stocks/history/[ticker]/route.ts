import { NextResponse } from "next/server"
import { parseStockRange } from "@/lib/stock-range"
import { getStockHistory } from "@/lib/services/stock-history.service"

type Ctx = { params: Promise<{ ticker: string }> }

export async function GET(req: Request, ctx: Ctx) {
  const { ticker } = await ctx.params
  const { searchParams } = new URL(req.url)
  const range = parseStockRange(searchParams.get("range"))
  const history = await getStockHistory(ticker, range)
  if (!history.available) {
    return NextResponse.json(history, { status: 503 })
  }
  return NextResponse.json(history)
}
