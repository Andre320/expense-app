import { describe, expect, it } from "vitest"
import {
  extractBComprasRawLines,
  parseBacComprasDelPeriodo,
  parseBCompraLine,
} from "@/lib/parsers/bacParser"

/** Minimal synthetic statement body after the B) marker (segment stops at C) or Total). */
function syntheticSection(linesAfterDolares: string): string {
  return [
    "B) Detalle de compras del periodo",
    "Encabezado (sin la palabra clave)",
    "Precios en colones y dólares",
    linesAfterDolares.trim(),
  ].join("\n")
}

describe("extractBComprasRawLines", () => {
  it("collects data lines after the dólares header and skips noise", () => {
    const full = syntheticSection(`
12345678901 15-ENE-25 MERCHANT ONE    CRC 10,000
N. 123 Referencia
Monto en colones
Página 2 de 2
12345678902 16-FEB-25 MERCHANT TWO    USD 25.50
    `)
    const lines = extractBComprasRawLines(full)
    expect(lines).toEqual([
      "12345678901 15-ENE-25 MERCHANT ONE    CRC 10,000",
      "12345678902 16-FEB-25 MERCHANT TWO    USD 25.50",
    ])
  })

  it("stops segment at C) Detalle footer", () => {
    const full =
      syntheticSection("12345678901 15-ENE-25 KEEP ME    CRC 100") +
      "\nC) Detalle de pagos\n12345678901 15-ENE-25 IGNORED    CRC 999"
    const lines = extractBComprasRawLines(full)
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain("KEEP ME")
  })

  it("stops segment at Total de compras del periodo", () => {
    const full =
      syntheticSection("12345678901 15-ENE-25 KEEP    CRC 50") +
      "\nTotal de compras del periodo 999"
    expect(extractBComprasRawLines(full)).toHaveLength(1)
  })
})

describe("parseBCompraLine", () => {
  it("parses CRC tail amount with thousands separator", () => {
    const row = parseBCompraLine("12345678901 15-ENE-25 ACME SUPERMARKET    CRC 12,345.50")
    expect(row).not.toBeNull()
    expect(row!.reference).toBe("12345678901")
    expect(row!.currencyCode).toBe("CRC")
    expect(row!.amountOriginal).toBe(12345.5)
    expect(row!.description).toBe("ACME SUPERMARKET")
    expect(row!.occurredAt).toMatch(/^2025-01-15T/)
  })

  it("parses USD amount", () => {
    const row = parseBCompraLine("1234567890123 3-DIC-24 WEB PAY    USD 99")
    expect(row).not.toBeNull()
    expect(row!.currencyCode).toBe("USD")
    expect(row!.amountOriginal).toBe(99)
    expect(row!.occurredAt).toMatch(/^2024-12-03T/)
  })

  it("returns null for No se registran", () => {
    expect(
      parseBCompraLine("12345678901 15-ENE-25 No se registran en este periodo    CRC 0"),
    ).toBeNull()
  })

  it("returns null for lines starting with asterisk", () => {
    expect(parseBCompraLine("* 12345678901 15-ENE-25 X    CRC 100")).toBeNull()
  })

  it("returns null when reference is too short", () => {
    expect(parseBCompraLine("123456789 15-ENE-25 X    CRC 100")).toBeNull()
  })

  it("returns null for non-positive amount", () => {
    expect(parseBCompraLine("12345678901 15-ENE-25 X    CRC 0")).toBeNull()
  })
})

describe("parseBacComprasDelPeriodo", () => {
  it("deduplicates identical purchase keys", () => {
    const full = syntheticSection(`
12345678901 15-ENE-25 DUP    CRC 100
12345678901 15-ENE-25 DUP    CRC 100
    `)
    const rows = parseBacComprasDelPeriodo(full)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.amountOriginal).toBe(100)
  })
})
