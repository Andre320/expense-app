/** Default equity ticker for the Stocks page chart and RSU forecast linkage. */
export const DEFAULT_STOCK_TICKER =
  process.env.NEXT_PUBLIC_DEFAULT_STOCK_TICKER?.trim().toUpperCase() || "SNOW"
