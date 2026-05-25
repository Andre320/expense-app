import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { importCsvTransactions } from "@/lib/import/services/csv-import.service"
import { csvImportZ } from "@/lib/shared/validators"

export async function POST(req: Request) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const json = await req.json().catch(() => null)
  const parsed = csvImportZ.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await importCsvTransactions(prisma, auth.userId, parsed.data)
  return NextResponse.json(result)
}
