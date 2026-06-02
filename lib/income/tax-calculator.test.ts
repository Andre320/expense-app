import { describe, expect, it } from "vitest"
import {
  computeCrSalary,
  computeCrSalaryFromMonthlyGrossCrc,
  CR_CCSS_EMPLOYEE_RATE_2026,
  grossMonthlyCrcFromInput,
  incomeTaxSalarioMonthlyCrc,
  roundCrc,
} from "@/lib/income/tax-calculator"

describe("incomeTaxSalarioMonthlyCrc", () => {
  it("exempt band edge: no tax at monthly ceiling", () => {
    expect(incomeTaxSalarioMonthlyCrc(918_000)).toBe(0)
  })

  it("first CRC above exempt taxed at 10% marginal", () => {
    expect(incomeTaxSalarioMonthlyCrc(920_000)).toBe(200)
  })

  it("applies 15% bracket on mid-high monthly gross", () => {
    expect(incomeTaxSalarioMonthlyCrc(2_000_000)).toBeGreaterThan(100_000)
  })

  it("applies top 25% bracket on very high gross", () => {
    const tax = incomeTaxSalarioMonthlyCrc(6_000_000)
    expect(tax).toBeGreaterThan(800_000)
  })

  it("returns zero tax for zero gross", () => {
    expect(incomeTaxSalarioMonthlyCrc(0)).toBe(0)
  })
})

describe("grossMonthlyCrcFromInput", () => {
  it("converts biweekly USD to monthly CRC", () => {
    expect(grossMonthlyCrcFromInput(1000, "BIWEEKLY", "USD", 500)).toBe(1_000_000)
  })

  it("clamps negative gross to zero", () => {
    expect(grossMonthlyCrcFromInput(-100, "MONTHLY", "CRC", 500)).toBe(0)
  })
})

describe("computeCrSalaryFromMonthlyGrossCrc", () => {
  it("combines CCSS, renta, and net for a mid-bracket monthly gross", () => {
    const gross = 1_000_000
    const b = computeCrSalaryFromMonthlyGrossCrc(gross)
    const ccss = roundCrc(gross * CR_CCSS_EMPLOYEE_RATE_2026)
    const renta = incomeTaxSalarioMonthlyCrc(gross)
    expect(b.ccssMonthlyCrc).toBe(ccss)
    expect(b.rentaMonthlyCrc).toBe(renta)
    expect(b.netMonthlyCrc).toBe(roundCrc(gross - b.ccssMonthlyCrc - b.rentaMonthlyCrc))
    expect(b.netMonthlyCrc).toBe(883_500)
  })

  it("applies voluntary % deductions on gross", () => {
    const gross = 1_000_000
    const b = computeCrSalaryFromMonthlyGrossCrc(gross, {
      voluntaryPct: {
        solidaristaPct: 1,
        pensionComplementariaPct: 2,
        esppPct: 0.5,
      },
    })
    expect(b.solidaristaMonthlyCrc).toBe(10_000)
    expect(b.pensionComplementariaMonthlyCrc).toBe(20_000)
    expect(b.esppMonthlyCrc).toBe(5000)
    const baseNet =
      gross -
      b.ccssMonthlyCrc -
      b.rentaMonthlyCrc -
      b.solidaristaMonthlyCrc -
      b.pensionComplementariaMonthlyCrc -
      b.esppMonthlyCrc
    expect(b.netMonthlyCrc).toBe(roundCrc(baseNet))
    expect(b.netMonthlyCrc).toBe(848_500)
  })

  it("uses custom CCSS rate when provided", () => {
    const b = computeCrSalaryFromMonthlyGrossCrc(1_000_000, { ccssRate: 0.05 })
    expect(b.ccssMonthlyCrc).toBe(50_000)
  })

  it("clamps NaN voluntary deduction percentages", () => {
    const b = computeCrSalaryFromMonthlyGrossCrc(1_000_000, {
      voluntaryPct: {
        solidaristaPct: Number.NaN,
        pensionComplementariaPct: 150,
        esppPct: -5,
      },
    })
    expect(b.solidaristaMonthlyCrc).toBe(0)
    expect(b.pensionComplementariaMonthlyCrc).toBe(1_000_000)
    expect(b.esppMonthlyCrc).toBe(0)
  })
})

describe("computeCrSalary", () => {
  it("computes from monthly CRC gross", () => {
    const b = computeCrSalary(1_000_000, "MONTHLY", "CRC", 500)
    expect(b.grossMonthlyCrc).toBe(1_000_000)
  })

  it("computes from biweekly USD gross", () => {
    const b = computeCrSalary(1000, "BIWEEKLY", "USD", 500)
    expect(b.grossMonthlyCrc).toBe(1_000_000)
  })
})
