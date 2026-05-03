/**
 * Dual-currency snapshot for a transaction.
 * `quotePerBase` = how many quote-currency units equal 1 base unit (e.g. USD→MXN).
 */
export function computeDualAmounts(opts: {
  amountOriginal: number;
  currencyCode: string;
  baseCurrency: string;
  quoteCurrency: string;
  quotePerBase: number;
}): {
  rateToBase: number;
  rateToQuote: number;
  amountBase: number;
  amountQuote: number;
} {
  const {
    amountOriginal,
    currencyCode,
    baseCurrency,
    quoteCurrency,
    quotePerBase,
  } = opts;
  const cur = currencyCode.toUpperCase();
  const base = baseCurrency.toUpperCase();
  const quote = quoteCurrency.toUpperCase();

  let rateToBase: number;
  let rateToQuote: number;

  if (cur === base) {
    rateToBase = 1;
    rateToQuote = quotePerBase;
  } else if (cur === quote) {
    rateToBase = quotePerBase > 0 ? 1 / quotePerBase : 0;
    rateToQuote = 1;
  } else {
    rateToBase = 1;
    rateToQuote = quotePerBase;
  }

  const amountBase = roundMoney(amountOriginal * rateToBase);
  const amountQuote = roundMoney(amountOriginal * rateToQuote);
  return { rateToBase, rateToQuote, amountBase, amountQuote };
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}
