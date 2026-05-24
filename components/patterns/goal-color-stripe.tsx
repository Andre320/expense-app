type Props = {
  color: string | null
  fallbackVar?: string
}

/**
 * User-defined hex colors need a runtime color value; single inline `backgroundColor`.
 */
export function GoalColorStripe({ color, fallbackVar = "var(--chart-savings)" }: Props) {
  return <div className="h-1 w-full" style={{ background: color ?? fallbackVar }} />
}
