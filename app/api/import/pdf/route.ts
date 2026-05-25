import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const form = await req.formData().catch(() => null)
  const file = form?.get("file")
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }
  const buf = Buffer.from(await file.arrayBuffer())
  try {
    const { PDFParse } = await import("pdf-parse")
    const parser = new PDFParse({ data: buf })
    const textRes = await parser.getText()
    await parser.destroy()
    return NextResponse.json({
      text: textRes.text ?? "",
      pages: textRes.total ?? 0,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Parse failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
