import { describe, expect, it } from "vitest";
import {
  computeCrSalaryFromMonthlyGrossCrc,
  CR_CCSS_EMPLOYEE_RATE_2026,
  incomeTaxSalarioMonthlyCrc,
  roundCrc,
} from "@/lib/utils/taxCalculator";

describe("incomeTaxSalarioMonthlyCrc", () => {
  it("exempt band edge: no tax at monthly ceiling", () => {
    expect(incomeTaxSalarioMonthlyCrc(918_000)).toBe(0);
  });

  it("first CRC above exempt taxed at 10% marginal", () => {
    expect(incomeTaxSalarioMonthlyCrc(920_000)).toBe(200);
  });
});

describe("computeCrSalaryFromMonthlyGrossCrc", () => {
  it("combines CCSS, renta, and net for a mid-bracket monthly gross", () => {
    const gross = 1_000_000;
    const b = computeCrSalaryFromMonthlyGrossCrc(gross);
    const ccss = roundCrc(gross * CR_CCSS_EMPLOYEE_RATE_2026);
    const renta = incomeTaxSalarioMonthlyCrc(gross);
    expect(b.ccssMonthlyCrc).toBe(ccss);
    expect(b.rentaMonthlyCrc).toBe(renta);
    expect(b.netMonthlyCrc).toBe(
      roundCrc(gross - b.ccssMonthlyCrc - b.rentaMonthlyCrc),
    );
    expect(b.netMonthlyCrc).toBe(883_500);
  });

  it("applies voluntary % deductions on gross", () => {
    const gross = 1_000_000;
    const b = computeCrSalaryFromMonthlyGrossCrc(gross, {
      voluntaryPct: {
        solidaristaPct: 1,
        pensionComplementariaPct: 2,
        esppPct: 0.5,
      },
    });
    expect(b.solidaristaMonthlyCrc).toBe(10_000);
    expect(b.pensionComplementariaMonthlyCrc).toBe(20_000);
    expect(b.esppMonthlyCrc).toBe(5000);
    const baseNet =
      gross -
      b.ccssMonthlyCrc -
      b.rentaMonthlyCrc -
      b.solidaristaMonthlyCrc -
      b.pensionComplementariaMonthlyCrc -
      b.esppMonthlyCrc;
    expect(b.netMonthlyCrc).toBe(roundCrc(baseNet));
    expect(b.netMonthlyCrc).toBe(848_500);
  });
});
