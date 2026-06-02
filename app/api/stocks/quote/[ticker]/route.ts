import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { errorResponse } from "@/lib/shared/api-error"
import { getStockQuote } from "@/lib/stocks/services/quote.service"

type Ctx = { params: Promise<{ ticker: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { ticker } = await ctx.params
  try {
    const quote = await getStockQuote(ticker)
    if (!quote.available) {
      return NextResponse.json(quote, { status: 503 })
    }
    return NextResponse.json(quote)
  } catch (e) {
    console.error("[GET /api/stocks/quote]", e)
    return errorResponse("Could not load quote", 500)
  }
}
