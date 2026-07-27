/**
 * The single source of truth for how a weekly target is written.
 * A raw 0.5 or 0.1 must never reach the screen — "2 wks" and "Rarely" are
 * what a person means; the number is only how we store it.
 */
export const TARGETS = [
  { v: 7, label: 'Daily' },
  { v: 5, label: '5×/wk' },
  { v: 3, label: '3×/wk' },
  { v: 2, label: '2×/wk' },
  { v: 1, label: 'Weekly' },
  { v: 0.5, label: '2 wks' },
  { v: 0.25, label: 'Monthly' },
  { v: 0.1, label: 'Rarely' },
] as const

export function targetLabel(v: number): string {
  let best: { v: number; label: string } = TARGETS[0]
  for (const t of TARGETS) {
    if (Math.abs(t.v - v) < Math.abs(best.v - v)) best = t
  }
  return best.label
}
