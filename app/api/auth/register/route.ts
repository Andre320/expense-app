import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db/client"
import { ensureUserDefaults } from "@/lib/auth/onboarding"
import { registerZ } from "@/lib/shared/validators"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = registerZ.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const email = parsed.data.email.trim().toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name?.trim() || null,
      passwordHash,
    },
  })

  await ensureUserDefaults(user.id, prisma)

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}
