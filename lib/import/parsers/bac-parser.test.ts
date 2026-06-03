import { describe, expect, it } from "vitest"
import {
  extractBComprasRawLines,
  parseBacComprasDelPeriodo,
  parseBCompraLine,
} from "@/lib/import/parsers/bac-parser"

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

  it("stops collecting when another B) section starts", () => {
    const full =
      syntheticSection("12345678901 15-ENE-25 FIRST    CRC 100") +
      "\nB) Detalle de compras del periodo\n12345678901 15-ENE-25 SECOND    CRC 200"
    const lines = extractBComprasRawLines(full)
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain("FIRST")
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

  it("skips noise lines after dólares header", () => {
    const full = [
      "B) Detalle de compras del periodo",
      "Precios en colones y dólares",
      "N. 123 Referencia",
      "Monto en colones",
      "colones",
      "Página 1 de 3",
      "-- footer",
      "TARJETA DE CREDITO VISA",
      "12345678901 15-ENE-25 MERCHANT    CRC 500",
    ].join("\n")
    expect(extractBComprasRawLines(full)).toEqual(["12345678901 15-ENE-25 MERCHANT    CRC 500"])
  })

  it("clears started flag when B) marker line appears inside section", () => {
    const full = [
      "B) Detalle de compras del periodo",
      "Precios en colones y dólares",
      "12345678901 15-ENE-25 FIRST    CRC 100",
      "B) Detalle de compras del periodo",
      "12345678901 15-ENE-25 SKIPPED    CRC 999",
      "Precios en colones y dólares",
      "12345678902 16-FEB-25 SECOND    CRC 200",
    ].join("\n")
    expect(extractBComprasRawLines(full)).toEqual([
      "12345678901 15-ENE-25 FIRST    CRC 100",
      "12345678902 16-FEB-25 SECOND    CRC 200",
    ])
  })

  it("resets collection when a nested B) marker appears", () => {
    const full = [
      "B) Detalle de compras del periodo",
      "Precios en colones y dólares",
      "12345678901 15-ENE-25 FIRST    CRC 100",
      "B) Detalle de compras del periodo",
      "Precios en colones y dólares",
      "12345678902 16-FEB-25 SECOND    CRC 200",
    ].join("\n")
    const lines = extractBComprasRawLines(full)
    expect(lines).toEqual([
      "12345678901 15-ENE-25 FIRST    CRC 100",
      "12345678902 16-FEB-25 SECOND    CRC 200",
    ])
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

  it("returns null for unparseable purchase date", () => {
    expect(parseBCompraLine("12345678901 99-ZZZ-99 MERCHANT    CRC 100")).toBeNull()
  })

  it("returns null when head does not match purchase layout", () => {
    expect(parseBCompraLine("not-a-purchase-line CRC 100")).toBeNull()
  })
})

describe("parseBacComprasDelPeriodo", () => {
  it("parses purchase lines as extracted from the e2e pdf-lib fixture", () => {
    const full = [
      "B) Detalle de compras del periodo",
      "Encabezado",
      "Precios en colones y dólares",
      "12345678901 15-ENE-25 SUPERMARKET CHAIN CRC 5,000",
      "",
      "-- 1 of 1 --",
      "",
    ].join("\n")
    const rows = parseBacComprasDelPeriodo(full)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.reference).toBe("12345678901")
    expect(rows[0]!.description).toBe("SUPERMARKET CHAIN")
  })

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
