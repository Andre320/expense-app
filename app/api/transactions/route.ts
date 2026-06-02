import { NextResponse } from "next/server"
import { apiRequireUser } from "@/lib/auth/api-context"
import { prisma } from "@/lib/db/client"
import { errorResponse, validationErrorResponse } from "@/lib/shared/api-error"
import { transactionCreateZ } from "@/lib/shared/validators"
import {
  createTransaction,
  listTransactions,
} from "@/lib/transactions/services/transaction.service"

export async function GET(req: Request) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const { searchParams } = new URL(req.url)
  try {
    const result = await listTransactions(prisma, auth.userId, {
      page: Number(searchParams.get("page") ?? "1") || 1,
      pageSize: Number(searchParams.get("pageSize") ?? "20") || 20,
      kind: searchParams.get("kind"),
      q: searchParams.get("q"),
      sortBy: searchParams.get("sortBy"),
      sortDir: searchParams.get("sortDir"),
    })
    return NextResponse.json(result)
  } catch (e) {
    console.error("[GET /api/transactions]", e)
    return errorResponse("Could not load transactions", 500)
  }
}

export async function POST(req: Request) {
  const auth = await apiRequireUser()
  if (auth.response) return auth.response

  const json = await req.json().catch(() => null)
  const parsed = transactionCreateZ.safeParse(json)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }

  try {
    const created = await createTransaction(prisma, auth.userId, parsed.data)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed"
    return errorResponse(msg, 400)
  }
}
