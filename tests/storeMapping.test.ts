import { describe, expect, it } from "vitest"
import { matchStoreMapping, type StoreMappingRule } from "@/lib/store-mapping"

const fb = { displayName: "Other", categoryId: "cat-fallback" }

function rule(
  overrides: Partial<StoreMappingRule> &
    Pick<StoreMappingRule, "id" | "pattern" | "displayName" | "categoryId">,
): StoreMappingRule {
  return {
    position: 0,
    ...overrides,
  }
}

describe("matchStoreMapping", () => {
  it("prefers longer pattern over shorter prefix", () => {
    const rules: StoreMappingRule[] = [
      rule({
        id: "a",
        pattern: "MXM",
        displayName: "MXM generic",
        categoryId: "c1",
        position: 0,
      }),
      rule({
        id: "b",
        pattern: "MXM HEREDIA",
        displayName: "MXM Heredia",
        categoryId: "c2",
        position: 1,
      }),
    ]
    const r = matchStoreMapping("COMPRA MXM HEREDIA CENTRO", rules, fb)
    expect(r.displayName).toBe("MXM Heredia")
    expect(r.categoryId).toBe("c2")
    expect(r.matchedPattern).toBe("MXM HEREDIA")
    expect(r.ruleId).toBe("b")
  })

  it("matches using NFKC-normalized haystack (compatibility forms)", () => {
    const rules: StoreMappingRule[] = [
      rule({
        id: "1",
        pattern: "office",
        displayName: "Office",
        categoryId: "office",
        position: 0,
      }),
    ]
    // U+FB01 Latin small ligature fi → NFKC "fi"
    const concept = "PAYMENT AT OF\uFB01CE SUPPLIES"
    const r = matchStoreMapping(concept, rules, fb)
    expect(r.matchedPattern).toBe("office")
    expect(r.displayName).toBe("Office")
  })

  it("skips empty or whitespace-only patterns", () => {
    const rules: StoreMappingRule[] = [
      rule({
        id: "empty",
        pattern: "   ",
        displayName: "Bad",
        categoryId: "bad",
        position: 0,
      }),
      rule({
        id: "ok",
        pattern: "ACME",
        displayName: "Acme",
        categoryId: "acme",
        position: 1,
      }),
    ]
    const r = matchStoreMapping("ACME STORE", rules, fb)
    expect(r.ruleId).toBe("ok")
  })

  it("tie-breaks equal-length patterns by lower position, then lexicographic pattern", () => {
    const rules: StoreMappingRule[] = [
      rule({
        id: "later-pos",
        pattern: "foo",
        displayName: "Later",
        categoryId: "x",
        position: 5,
      }),
      rule({
        id: "earlier-pos",
        pattern: "foo",
        displayName: "Earlier",
        categoryId: "y",
        position: 1,
      }),
    ]
    const r = matchStoreMapping("prefix foo suffix", rules, fb)
    expect(r.ruleId).toBe("earlier-pos")
  })

  it("uses lexicographic pattern order when length and position tie", () => {
    const rules: StoreMappingRule[] = [
      rule({
        id: "bb",
        pattern: "bb",
        displayName: "BB",
        categoryId: "x",
        position: 0,
      }),
      rule({
        id: "aa",
        pattern: "aa",
        displayName: "AA",
        categoryId: "y",
        position: 0,
      }),
    ]
    const r = matchStoreMapping("bbaa", rules, fb)
    expect(r.matchedPattern).toBe("aa")
    expect(r.ruleId).toBe("aa")
  })

  it("returns fallback when nothing matches", () => {
    const r = matchStoreMapping("no match here", [], fb)
    expect(r.displayName).toBe(fb.displayName)
    expect(r.categoryId).toBe(fb.categoryId)
    expect(r.matchedPattern).toBeNull()
    expect(r.ruleId).toBeNull()
  })
})
