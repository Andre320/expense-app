import { NextResponse } from "next/server";
import { getStockHistory } from "@/lib/services/stock-history.service";

type Ctx = { params: Promise<{ ticker: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { ticker } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") ?? "90");
  const history = await getStockHistory(ticker, days);
  if (!history.available) {
    return NextResponse.json(history, { status: 503 });
  }
  return NextResponse.json(history);
}
