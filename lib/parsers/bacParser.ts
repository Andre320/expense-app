/**
 * Parses BAC Costa Rica credit-card statements (text layer from PDF).
 * Targets section "B) Detalle de compras del periodo".
 */

const B_MARKER = "B) Detalle de compras del periodo";

const MONTHS: Record<string, number> = {
  ENE: 1,
  FEB: 2,
  MAR: 3,
  ABR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AGO: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DIC: 12,
};

export type BacCompraRow = {
  reference: string;
  occurredAt: string;
  description: string;
  currencyCode: "CRC" | "USD";
  amountOriginal: number;
};

function parseBacDate(s: string): Date | null {
  const m = s.match(/^(\d{1,2})-([A-Z]{3})-(\d{2})$/i);
  if (!m) return null;
  const day = Number(m[1]);
  const mon = MONTHS[m[2]!.toUpperCase()];
  const yy = Number(m[3]);
  if (!mon || !Number.isFinite(day) || !Number.isFinite(yy)) return null;
  const year = 2000 + yy;
  const d = new Date(Date.UTC(year, mon - 1, day, 12, 0, 0));
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseAmount(s: string): number {
  const cleaned = s.replace(/,/g, "").replace(/-$/, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.abs(n) : NaN;
}

/** Lines after B) marker until C) or Total line (one card / continuation). */
function segmentBody(segmentAfterMarker: string): string {
  const cIdx = segmentAfterMarker.indexOf("\nC) Detalle");
  const tIdx = segmentAfterMarker.indexOf("\nTotal de compras del periodo");
  const ends = [cIdx, tIdx].filter((x) => x >= 0);
  const end = ends.length ? Math.min(...ends) : segmentAfterMarker.length;
  return segmentAfterMarker.slice(0, end);
}

/** Drop table header lines; start after first line containing "dólares". */
export function extractBComprasRawLines(fullText: string): string[] {
  const parts = fullText.split(B_MARKER);
  const out: string[] = [];

  for (let p = 1; p < parts.length; p++) {
    const body = segmentBody(parts[p]!);
    const lines = body.split(/\r?\n/).map((l) => l.trim());
    let started = false;

    for (const line of lines) {
      if (!line) continue;
      if (!started) {
        if (line.includes("dólares")) started = true;
        continue;
      }
      if (line.startsWith("N.") && line.includes("Referencia")) continue;
      if (line.startsWith("Monto en")) continue;
      if (line === "colones") continue;
      if (line.startsWith("Página ") || line.startsWith("-- ")) continue;
      if (line.startsWith("TARJETA DE CREDITO")) continue;
      if (line.startsWith(B_MARKER)) {
        started = false;
        continue;
      }
      out.push(line);
    }
  }

  return out;
}

const CURRENCY_TAIL = /\s(CRC|USD)\s+([\d,]+(?:\.\d+)?)\s*$/i;

export function parseBCompraLine(line: string): BacCompraRow | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.includes("No se registran")) return null;
  if (trimmed.startsWith("*")) return null;
  if (!/^\d/.test(trimmed)) return null;

  const cur = trimmed.match(CURRENCY_TAIL);
  if (!cur || cur.index === undefined) return null;

  const currencyCode = cur[1]!.toUpperCase() as "CRC" | "USD";
  if (currencyCode !== "CRC" && currencyCode !== "USD") return null;

  const amountOriginal = parseAmount(cur[2]!);
  if (!Number.isFinite(amountOriginal) || amountOriginal <= 0) return null;

  const head = trimmed.slice(0, cur.index).trim();
  const headM = head.match(/^(\d{10,})\s+(\d{1,2}-[A-Z]{3}-\d{2})\s+(.+)$/i);
  if (!headM) return null;

  const reference = headM[1]!;
  const dateStr = headM[2]!;
  const description = headM[3]!.trim().replace(/\s+/g, " ");
  const dt = parseBacDate(dateStr);
  if (!dt) return null;

  return {
    reference,
    occurredAt: dt.toISOString(),
    description,
    currencyCode,
    amountOriginal,
  };
}

export function parseBacComprasDelPeriodo(fullText: string): BacCompraRow[] {
  const lines = extractBComprasRawLines(fullText);
  const rows: BacCompraRow[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const row = parseBCompraLine(line);
    if (!row) continue;
    const key = `${row.reference}|${row.occurredAt}|${row.amountOriginal}|${row.currencyCode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
  }

  return rows;
}
