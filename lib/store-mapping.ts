export type StoreMappingRule = {
  id: string;
  pattern: string;
  displayName: string;
  categoryId: string;
  position: number;
};

/**
 * Case-insensitive substring match. Longer patterns are tried first so specific
 * rules win over short prefixes (e.g. "MXM HEREDIA" before "MXM").
 */
export function matchStoreMapping(
  concepto: string,
  rules: StoreMappingRule[],
  fallback: { displayName: string; categoryId: string },
): {
  displayName: string;
  categoryId: string;
  matchedPattern: string | null;
  ruleId: string | null;
} {
  const haystack = concepto.normalize("NFKC").toLowerCase();
  const sorted = [...rules].sort(
    (a, b) =>
      b.pattern.trim().length - a.pattern.trim().length ||
      a.position - b.position ||
      a.pattern.localeCompare(b.pattern),
  );

  for (const r of sorted) {
    const p = r.pattern.trim().toLowerCase();
    if (!p) continue;
    if (haystack.includes(p)) {
      return {
        displayName: r.displayName.trim(),
        categoryId: r.categoryId,
        matchedPattern: r.pattern,
        ruleId: r.id,
      };
    }
  }

  return {
    displayName: fallback.displayName,
    categoryId: fallback.categoryId,
    matchedPattern: null,
    ruleId: null,
  };
}
