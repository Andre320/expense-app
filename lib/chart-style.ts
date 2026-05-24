import type { CSSProperties } from "react"

/** Shared Recharts tooltip panel (object form for `contentStyle`). */
export const rechartsTooltipContentStyle: CSSProperties = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  opacity: 1,
  color: "hsl(var(--popover-foreground))",
  boxShadow: "0 4px 16px rgb(0 0 0 / 0.45)",
  padding: "8px 12px",
}

export const rechartsTooltipLabelStyle: CSSProperties = {
  color: "hsl(var(--foreground))",
  fontWeight: 600,
  marginBottom: 6,
  opacity: 1,
}

export const rechartsTooltipItemStyle: CSSProperties = {
  color: "hsl(var(--foreground))",
  opacity: 1,
  paddingTop: 2,
  paddingBottom: 2,
}
