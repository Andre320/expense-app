import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import {
  buildBacImportPreview,
  type BacImportPreviewRow,
} from "@/lib/import/services/bac-import.service"
import { errorResponse } from "@/lib/shared/api-error"

export const runtime = "nodejs"

export type { BacImportPreviewRow }

export async function POST(req: Request) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const form = await req.formData().catch(() => null)
  const file = form?.get("file")
  if (!file || !(file instanceof File)) {
    return errorResponse("Missing file", 400)
  }
  const buf = Buffer.from(await file.arrayBuffer())
  try {
    const { PDFParse } = await import("pdf-parse")
    const parser = new PDFParse({ data: buf })
    const textRes = await parser.getText()
    await parser.destroy()
    const text = textRes.text ?? ""
    const { transactions, warnings } = await buildBacImportPreview(prisma, auth.userId, text)

    return NextResponse.json({
      bank: "BAC",
      pages: textRes.total ?? 0,
      transactions,
      warnings,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Parse failed"
    return errorResponse(message, 400)
  }
}
