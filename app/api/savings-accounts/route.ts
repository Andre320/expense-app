import { NextResponse } from "next/server"
import { ensureAppDefaults, prisma } from "@/lib/db"
import {
  createSavingsAccount,
  listSerializedSavingsAccounts,
} from "@/lib/services/savings-account.service"
import { savingsAccountCreateZ } from "@/lib/validators"

export async function GET() {
  await ensureAppDefaults()
  return NextResponse.json(await listSerializedSavingsAccounts(prisma))
}

export async function POST(req: Request) {
  await ensureAppDefaults()
  const json = await req.json().catch(() => null)
  const parsed = savingsAccountCreateZ.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const created = await createSavingsAccount(prisma, parsed.data)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
