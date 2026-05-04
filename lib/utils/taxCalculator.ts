/**
 * Costa Rica salaried income estimates (Impuesto al Salario + obrero CCSS + optional % payroll items).
 *
 * Sources (2026 fiscal period, e.g. Decreto Ejecutivo 45333-H and CCSS adjustments):
 * - Monthly salary tax brackets: Ministerio de Hacienda / professional summaries (BDO, García Bodán, etc.).
 * - Employee CCSS total rate effective Jan 2026: ~10.83% per CCSS/BDO communications.
 *
 * Solidarista, pensión complementaria, and ESPP (or similar) are modeled as **% of gross** — configurable in Settings.
 *
 * This is an approximation for planning only — not legal or tax advice.
 */

/** Total employee CCSS + Banco Popular worker share on gross salary (2026). */
export const CR_CCSS_EMPLOYEE_RATE_2026 = 0.1083;

/** Legacy 2025 rate; exposed for comparisons only. */
export const CR_CCSS_EMPLOYEE_RATE_2025 = 0.1067;

/**
 * Monthly "Impuesto al Salario" brackets (colones), progressive marginal rates.
 * Thresholds from Hacienda tramos 2026 (salary / asimilados mensual).
 */
const SALARIO_MONTHLY_BRACKETS: readonly { ceiling: number; rate: number }[] = [
  { ceiling: 918_000, rate: 0 },
  { ceiling: 1_347_000, rate: 0.1 },
  { ceiling: 2_364_000, rate: 0.15 },
  { ceiling: 4_727_000, rate: 0.2 },
  { ceiling: Number.POSITIVE_INFINITY, rate: 0.25 },
] as const;

export type CrPayPeriod = "MONTHLY" | "BIWEEKLY";

/** Percent of gross (0–100 each). */
export type CrVoluntaryDeductionsPct = {
  solidaristaPct: number;
  pensionComplementariaPct: number;
  esppPct: number;
};

export const defaultVoluntaryDeductionsPct = (): CrVoluntaryDeductionsPct => ({
  solidaristaPct: 0,
  pensionComplementariaPct: 0,
  esppPct: 0,
});

export type CrSalaryBreakdown = {
  grossMonthlyCrc: number;
  ccssMonthlyCrc: number;
  rentaMonthlyCrc: number;
  solidaristaMonthlyCrc: number;
  pensionComplementariaMonthlyCrc: number;
  esppMonthlyCrc: number;
  netMonthlyCrc: number;
  netBiweeklyCrc: number;
  grossBiweeklyCrc: number;
  ccssBiweeklyCrc: number;
  rentaBiweeklyCrc: number;
  solidaristaBiweeklyCrc: number;
  pensionComplementariaBiweeklyCrc: number;
  esppBiweeklyCrc: number;
};

export function roundCrc(n: number): number {
  return Math.round(n);
}

function clampPct(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

/**
 * Converts user gross input to **monthly** gross in CRC.
 * Bi-weekly = Costa Rican quincena (24 pay periods/year → ×2 for monthly equivalent).
 */
export function grossMonthlyCrcFromInput(
  grossInput: number,
  period: CrPayPeriod,
  inputCurrency: "CRC" | "USD",
  crcPerUsd: number,
): number {
  const inCrc =
    inputCurrency === "CRC" ? grossInput : grossInput * Math.max(crcPerUsd, 1e-9);
  const monthly = period === "MONTHLY" ? inCrc : inCrc * 2;
  return Math.max(0, monthly);
}

/** Progressive marginal income tax on monthly gross salary (CRC). */
export function incomeTaxSalarioMonthlyCrc(grossMonthlyCrc: number): number {
  let prev = 0;
  let tax = 0;
  const g = Math.max(0, grossMonthlyCrc);
  for (const { ceiling, rate } of SALARIO_MONTHLY_BRACKETS) {
    if (g <= prev) break;
    const top = Math.min(g, ceiling);
    const chunk = top - prev;
    if (chunk > 0) tax += chunk * rate;
    prev = ceiling;
  }
  return roundCrc(tax);
}

/**
 * Full monthly breakdown in CRC. Pass monthly gross (already converted).
 * Optional deductions: Asociación Solidarista, pensión complementaria, ESPP — each as % of gross.
 */
export function computeCrSalaryFromMonthlyGrossCrc(
  grossMonthlyCrc: number,
  options?: {
    ccssRate?: number;
    voluntaryPct?: CrVoluntaryDeductionsPct;
  },
): CrSalaryBreakdown {
  const g = Math.max(0, grossMonthlyCrc);
  const rate = options?.ccssRate ?? CR_CCSS_EMPLOYEE_RATE_2026;
  const ccssMonthlyCrc = roundCrc(g * rate);
  const rentaMonthlyCrc = incomeTaxSalarioMonthlyCrc(g);

  const vp = options?.voluntaryPct ?? defaultVoluntaryDeductionsPct();
  const solidaristaMonthlyCrc = roundCrc(g * (clampPct(vp.solidaristaPct) / 100));
  const pensionComplementariaMonthlyCrc = roundCrc(
    g * (clampPct(vp.pensionComplementariaPct) / 100),
  );
  const esppMonthlyCrc = roundCrc(g * (clampPct(vp.esppPct) / 100));

  const netMonthlyCrc = roundCrc(
    g -
      ccssMonthlyCrc -
      rentaMonthlyCrc -
      solidaristaMonthlyCrc -
      pensionComplementariaMonthlyCrc -
      esppMonthlyCrc,
  );

  return {
    grossMonthlyCrc: roundCrc(g),
    ccssMonthlyCrc,
    rentaMonthlyCrc,
    solidaristaMonthlyCrc,
    pensionComplementariaMonthlyCrc,
    esppMonthlyCrc,
    netMonthlyCrc,
    netBiweeklyCrc: roundCrc(netMonthlyCrc / 2),
    grossBiweeklyCrc: roundCrc(g / 2),
    ccssBiweeklyCrc: roundCrc(ccssMonthlyCrc / 2),
    rentaBiweeklyCrc: roundCrc(rentaMonthlyCrc / 2),
    solidaristaBiweeklyCrc: roundCrc(solidaristaMonthlyCrc / 2),
    pensionComplementariaBiweeklyCrc: roundCrc(pensionComplementariaMonthlyCrc / 2),
    esppBiweeklyCrc: roundCrc(esppMonthlyCrc / 2),
  };
}

/** End-to-end from UI gross + period + currency. */
export function computeCrSalary(
  grossInput: number,
  period: CrPayPeriod,
  inputCurrency: "CRC" | "USD",
  crcPerUsd: number,
  voluntaryPct?: CrVoluntaryDeductionsPct,
): CrSalaryBreakdown {
  const monthly = grossMonthlyCrcFromInput(grossInput, period, inputCurrency, crcPerUsd);
  return computeCrSalaryFromMonthlyGrossCrc(monthly, { voluntaryPct });
}

/**
 * Convert planned **monthly net** in CRC to app `monthlyIncomeBase` (base currency).
 * Uses `quotePerBase` when quote is CRC, or `crCrcPerUsd` when base is USD.
 */
export function plannedNetCrcToMonthlyIncomeBase(params: {
  netMonthlyCrc: number;
  baseCurrency: string;
  quoteCurrency: string;
  quotePerBase: number;
  crCrcPerUsd: number;
}): number {
  const bc = params.baseCurrency.toUpperCase();
  const qc = params.quoteCurrency.toUpperCase();
  const net = params.netMonthlyCrc;

  if (bc === "CRC") return net;
  if (qc === "CRC" && params.quotePerBase > 0) {
    return net / params.quotePerBase;
  }
  if (bc === "USD" && params.crCrcPerUsd > 0) {
    return net / params.crCrcPerUsd;
  }
  throw new Error(
    "Cannot convert CRC net to your base currency: set quote to CRC with a rate, or set base to USD and configure CRC per 1 USD under Settings → Costa Rica.",
  );
}
