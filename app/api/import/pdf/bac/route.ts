import { NextResponse } from "next/server";
import { ensureAppDefaults, prisma } from "@/lib/db";
import {
  buildBacImportPreview,
  type BacImportPreviewRow,
} from "@/lib/services/importBac.service";

export const runtime = "nodejs";

export type { BacImportPreviewRow };

export async function POST(req: Request) {
  await ensureAppDefaults();
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buf });
    const textRes = await parser.getText();
    await parser.destroy();
    const text = textRes.text ?? "";
    const { transactions, warnings } = await buildBacImportPreview(prisma, text);

    return NextResponse.json({
      bank: "BAC",
      pages: textRes.total ?? 0,
      transactions,
      warnings,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Parse failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
