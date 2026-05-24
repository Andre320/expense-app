import { NextResponse } from "next/server"
import { ensureAppDefaults, prisma } from "@/lib/db"
import { knownStoreCreateZ } from "@/lib/validators"

export async function GET() {
  await ensureAppDefaults()
  const rows = await prisma.knownStore.findMany({
    orderBy: [{ position: "asc" }, { pattern: "asc" }],
    include: { category: { select: { id: true, name: true, kind: true } } },
  })
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      pattern: r.pattern,
      displayName: r.displayName,
      categoryId: r.categoryId,
      categoryName: r.category.name,
      categoryKind: r.category.kind,
      position: r.position,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  )
}

export async function POST(req: Request) {
  await ensureAppDefaults()
  const json = await req.json().catch(() => null)
  const parsed = knownStoreCreateZ.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const cat = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId },
  })
  if (!cat) {
    return NextResponse.json({ error: "Category not found" }, { status: 400 })
  }

  const patternNorm = parsed.data.pattern.trim().toLowerCase()
  const existingPatterns = await prisma.knownStore.findMany({
    select: { pattern: true },
  })
  if (existingPatterns.some((s) => s.pattern.toLowerCase() === patternNorm)) {
    return NextResponse.json(
      { error: "A mapping with this pattern already exists" },
      { status: 409 },
    )
  }

  const maxPos = await prisma.knownStore.aggregate({ _max: { position: true } })
  const position = (maxPos._max.position ?? 0) + 1

  const created = await prisma.knownStore.create({
    data: {
      pattern: parsed.data.pattern.trim(),
      displayName: parsed.data.displayName.trim(),
      categoryId: parsed.data.categoryId,
      position,
    },
    include: { category: { select: { id: true, name: true, kind: true } } },
  })

  return NextResponse.json(
    {
      id: created.id,
      pattern: created.pattern,
      displayName: created.displayName,
      categoryId: created.categoryId,
      categoryName: created.category.name,
      position: created.position,
    },
    { status: 201 },
  )
}
