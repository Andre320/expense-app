import { NextResponse } from "next/server"
import { ensureAppDefaults, prisma } from "@/lib/db"
import { getSerializedSettings, patchSerializedSettings } from "@/lib/services/settings.service"
import { settingsPatchZ } from "@/lib/validators"

export async function GET() {
  await ensureAppDefaults()
  return NextResponse.json(await getSerializedSettings(prisma))
}

export async function PATCH(req: Request) {
  await ensureAppDefaults()
  const json = await req.json().catch(() => null)
  const parsed = settingsPatchZ.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const updated = await patchSerializedSettings(prisma, parsed.data)
  return NextResponse.json(updated)
}
