import { NextResponse } from "next/server"
import { getStockQuote } from "@/lib/services/stock-quote.service"

type Ctx = { params: Promise<{ ticker: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { ticker } = await ctx.params
  const quote = await getStockQuote(ticker)
  if (!quote.available) {
    return NextResponse.json(quote, { status: 503 })
  }
  return NextResponse.json(quote)
}
