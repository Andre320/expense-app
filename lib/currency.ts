import { QUOTE_CURRENCY, REPORTING_CURRENCY } from "./app-currency";

export function normalizeCurrencyCode(currencyCode?: string | null): string {
  const cur = (currencyCode ?? REPORTING_CURRENCY).toUpperCase();
  if (cur === REPORTING_CURRENCY || cur === QUOTE_CURRENCY) return cur;
  return REPORTING_CURRENCY;
}

/**
 * Dual-currency snapshot: CRC (reporting) + USD.
 * `crcPerUsd` = colones per 1 US dollar.
 */
export function computeDualAmounts(opts: {
  amountOriginal: number;
  currencyCode?: string | null;
  crcPerUsd: number;
}): {
  rateToBase: number;
  rateToQuote: number;
  amountBase: number;
  amountQuote: number;
} {
  const cur = normalizeCurrencyCode(opts.currencyCode);  const rate = Math.max(opts.crcPerUsd, 1e-9);

  let rateToBase: number;
  let rateToQuote: number;

  if (cur === REPORTING_CURRENCY) {
    rateToBase = 1;
    rateToQuote = 1 / rate;
  } else if (cur === QUOTE_CURRENCY) {
    rateToBase = rate;
    rateToQuote = 1;
  } else {
    rateToBase = 1;
    rateToQuote = 1 / rate;
  }

  const amountBase = roundMoney(opts.amountOriginal * rateToBase);
  const amountQuote = roundMoney(opts.amountOriginal * rateToQuote);
  return { rateToBase, rateToQuote, amountBase, amountQuote };
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Convert an amount in CRC or USD to reporting currency (CRC). */
export function amountToReportingBase(
  amount: number,
  currencyCode: string | null | undefined,
  crcPerUsd: number,
): number {
  return computeDualAmounts({
    amountOriginal: amount,
    currencyCode,
    crcPerUsd,
  }).amountBase;
}
