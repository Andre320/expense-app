/**
 * One-off generator for e2e/fixtures/bac-sample.pdf (text layer for pdf-parse).
 * Run: node scripts/generate-bac-e2e-fixture.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { PDFDocument, StandardFonts } from "pdf-lib"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, "..", "e2e", "fixtures", "bac-sample.pdf")

const lines = [
  "B) Detalle de compras del periodo",
  "Encabezado",
  "Precios en colones y dólares",
  "12345678901 15-ENE-25 SUPERMARKET CHAIN    CRC 5,000",
]

async function main() {
  const doc = await PDFDocument.create()
  const page = doc.addPage([612, 792])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  let y = 720
  for (const line of lines) {
    page.drawText(line, { x: 40, y, size: 11, font })
    y -= 16
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, await doc.save())

  const { PDFParse } = await import("pdf-parse")
  const parser = new PDFParse({ data: fs.readFileSync(outPath) })
  const { text } = await parser.getText()
  await parser.destroy()

  const required = "B) Detalle de compras del periodo"
  if (!text?.includes(required) || !text.includes("SUPERMARKET CHAIN")) {
    console.error("pdf-parse did not extract expected BAC text:\n", text)
    process.exit(1)
  }
  console.log(`Wrote ${outPath} (${fs.statSync(outPath).size} bytes)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
