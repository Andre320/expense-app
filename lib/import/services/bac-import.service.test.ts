import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PrismaClient } from "@/app/generated/prisma/client"
import { loadStoreMappingContext } from "@/lib/import/store-context"
import { buildBacImportPreview } from "@/lib/import/services/bac-import.service"

vi.mock("@/lib/import/store-context", () => ({
  loadStoreMappingContext: vi.fn(),
}))

const syntheticBBlock = [
  "B) Detalle de compras del periodo",
  "Encabezado",
  "Precios en colones y dólares",
  "12345678901 15-ENE-25 SUPERMARKET CHAIN    CRC 5,000",
].join("\n")

describe("buildBacImportPreview", () => {
  const findMany = vi.fn()

  const prisma = {
    category: { findMany },
  } as unknown as PrismaClient

  beforeEach(() => {
    findMany.mockReset()
    vi.mocked(loadStoreMappingContext).mockReset()
    vi.mocked(loadStoreMappingContext).mockResolvedValue({
      rules: [
        {
          id: "rule-1",
          pattern: "SUPERMARKET",
          displayName: "Groceries mapped",
          categoryId: "cat-grocery",
          position: 0,
        },
      ],
      uncategorizedCategoryId: "cat-uncat",
    })
    findMany.mockResolvedValue([
      { id: "cat-grocery", name: "Groceries" },
      { id: "cat-uncat", name: "Uncategorized" },
    ])
  })

  it("maps descriptions via store rules and attaches category names", async () => {
    const { transactions, warnings } = await buildBacImportPreview(
      prisma,
      "user-1",
      syntheticBBlock,
    )
    expect(warnings).toEqual([])
    expect(transactions).toHaveLength(1)
    expect(transactions[0]!.displayName).toBe("Groceries mapped")
    expect(transactions[0]!.categoryId).toBe("cat-grocery")
    expect(transactions[0]!.categoryName).toBe("Groceries")
    expect(transactions[0]!.matchedPattern).toBe("SUPERMARKET")
    expect(transactions[0]!.amountColones).toBe(5000)
    expect(transactions[0]!.amountDollars).toBeNull()
    expect(findMany).toHaveBeenCalledOnce()
  })

  it("handles empty store rules with uncategorized fallback", async () => {
    vi.mocked(loadStoreMappingContext).mockResolvedValue({
      rules: [],
      uncategorizedCategoryId: "cat-uncat",
    })
    findMany.mockResolvedValue([{ id: "cat-uncat", name: "Uncategorized" }])
    const { transactions } = await buildBacImportPreview(prisma, "user-1", syntheticBBlock)
    expect(transactions[0]!.categoryId).toBe("cat-uncat")
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: ["cat-uncat"] } }),
      }),
    )
  })

  it("warns when no purchase rows were parsed", async () => {
    const { transactions, warnings } = await buildBacImportPreview(
      prisma,
      "user-1",
      "no B) section here",
    )
    expect(transactions).toHaveLength(0)
    expect(warnings.length).toBe(1)
    expect(warnings[0]).toContain("No purchase rows found")
  })

  it("maps USD purchase amounts to amountDollars", async () => {
    const usdBlock = [
      "B) Detalle de compras del periodo",
      "Precios en colones y dólares",
      "12345678901 15-ENE-25 ONLINE STORE USD    USD 25.50",
    ].join("\n")
    const { transactions } = await buildBacImportPreview(prisma, "user-1", usdBlock)
    expect(transactions[0]!.currencyCode).toBe("USD")
    expect(transactions[0]!.amountDollars).toBe(25.5)
    expect(transactions[0]!.amountColones).toBeNull()
  })
})
