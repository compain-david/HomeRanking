export type WeekRow = { week: string; alix: number; david: number }

/** A week counts as level when neither person carried more than 60%. */
export const BALANCED = 10

export function splitOf(w: WeekRow) {
  const total = w.alix + w.david
  const pctA = total ? Math.round((w.alix / total) * 100) : 50
  return { total, pctA, level: total > 0 && Math.abs(pctA - 50) <= BALANCED }
}

/**
 * Consecutive completed weeks that ended level, counting back from the most
 * recent. One streak for the household, never one each — an individual streak
 * gives you something to lose and someone to blame for losing it.
 */
export function streakOf(weeks: WeekRow[], currentWeek: string): number {
  const past = weeks.filter((w) => w.week < currentWeek).sort((a, b) => b.week.localeCompare(a.week))
  let n = 0
  for (const w of past) {
    if (!splitOf(w).level) break
    n++
  }
  return n
}

/** Weeks whose Monday falls inside the given month, e.g. "2026-07". */
export function monthOf(weeks: WeekRow[], month: string) {
  const rows = weeks.filter((w) => w.week.startsWith(month))
  return rows.reduce(
    (acc, w) => ({ alix: acc.alix + w.alix, david: acc.david + w.david }),
    { alix: 0, david: 0 },
  )
}

export const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

export const monthName = (d = new Date()) => d.toLocaleDateString('en-GB', { month: 'long' })

/**
 * The single most useful thing to say about a finished week. Ordered by what
 * actually matters: a hidden mental-load gap first, since that is the failure
 * the totals cannot show, then the split, then encouragement.
 */
export function verdictOf(
  week: WeekRow,
  mentalPctA: number | null,
): { headline: string; detail: string; tone: 'good' | 'warn' } {
  const { pctA, level, total } = splitOf(week)
  const heavier = pctA > 50 ? 'Alix' : 'David'
  const lighter = pctA > 50 ? 'David' : 'Alix'
  const share = Math.max(pctA, 100 - pctA)

  if (!total) {
    return {
      headline: 'A quiet week',
      detail: 'Nothing was logged. No verdict, no guilt — the week just resets.',
      tone: 'good',
    }
  }

  if (level && mentalPctA !== null && Math.abs(mentalPctA - 50) >= BALANCED) {
    const mHeavier = mentalPctA > 50 ? 'Alix' : 'David'
    return {
      headline: 'Level on paper',
      detail: `The totals came out even, but ${mHeavier} carried ${Math.max(mentalPctA, 100 - mentalPctA)}% of the mental load — the remembering, which the total never shows.`,
      tone: 'warn',
    }
  }

  if (level) {
    return {
      headline: 'A level week',
      detail: `${total} points between you, split almost evenly. This is the shape worth repeating.`,
      tone: 'good',
    }
  }

  return {
    headline: `${heavier} carried the week`,
    detail: `${share}% of ${total} points. Shifting about ${Math.round(Math.abs(week.alix - week.david) / 2)} points to ${lighter} would have levelled it.`,
    tone: 'warn',
  }
}
