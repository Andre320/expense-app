import { describe, expect, it, vi } from "vitest"

vi.mock("pdf-parse/worker", () => ({
  getData: () => "mock-worker",
}))

vi.mock("pdf-parse", () => ({
  PDFParse: class MockPDFParse {
    static setWorker() {}
    async getText() {
      return {}
    }
    async destroy() {}
  },
}))

describe("extractPdfText nullish fields", () => {
  it("defaults missing text and page count", async () => {
    const { extractPdfText } = await import("@/lib/import/pdf-text")
    const buf = Buffer.from("%PDF-1.4 mock")
    const result = await extractPdfText(buf)
    expect(result.text).toBe("")
    expect(result.pages).toBe(0)
  })
})
