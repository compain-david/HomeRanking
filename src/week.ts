/** The week runs Monday to Sunday and resets after Sunday. */
export function weekStart(d = new Date()): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = (x.getDay() + 6) % 7 // Monday = 0
  x.setDate(x.getDate() - dow)
  return x
}

export function weekKey(d = new Date()): string {
  const s = weekStart(d)
  const mm = String(s.getMonth() + 1).padStart(2, '0')
  const dd = String(s.getDate()).padStart(2, '0')
  return `${s.getFullYear()}-${mm}-${dd}`
}

/** e.g. "Mon 27 Jul — Sun 2 Aug" */
export function weekLabel(d = new Date()): string {
  const s = weekStart(d)
  const e = new Date(s)
  e.setDate(e.getDate() + 6)
  const f = (x: Date) =>
    x.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  return `${f(s)} — ${f(e)}`
}

/** Whole days left in the week, counting today. */
export function daysLeft(d = new Date()): number {
  return 7 - ((d.getDay() + 6) % 7)
}
