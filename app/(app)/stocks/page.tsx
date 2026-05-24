"use client";

import { PageIntro } from "@/components/patterns/page-intro";
import { RsuPlansManager } from "@/components/rsu-plans-manager";
import { StockPriceChart } from "@/components/stock-price-chart";

export default function StocksPage() {
  return (
    <div className="space-y-10">
      <PageIntro
        eyebrow="Equity compensation"
        title="Stocks"
        description="RSU grant plans with quarterly vest schedules, tax withholding, whole-share settlement with cash for fractions, and live quotes via Alpaca."
      />
      <StockPriceChart ticker="SNOW" days={90} />
      <RsuPlansManager />
    </div>
  );
}
