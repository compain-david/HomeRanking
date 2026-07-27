import { splitOf, type WeekRow } from './close'

export type Milestone = {
  id: string
  title: string
  caption: string
  achieved: boolean
}

/**
 * Shared milestones only — never one person's achievement. A milestone one of
 * you can win is a milestone the other one loses, which is the exact dynamic
 * this app is built to avoid.
 */
export function milestonesOf(
  weeks: WeekRow[],
  totals: { alix: number; david: number },
  mentalPctA: number | null,
): Milestone[] {
  const closed = weeks.filter((w) => w.alix + w.david > 0)
  const grand = totals.alix + totals.david

  // longest run of level weeks, newest first
  const ordered = [...closed].sort((a, b) => b.week.localeCompare(a.week))
  let run = 0
  for (const w of ordered) {
    if (!splitOf(w).level) break
    run++
  }

  return [
    {
      id: 'points',
      title: '500 points as a household',
      caption: grand >= 500 ? `${grand} points and counting` : `${grand} of 500 so far`,
      achieved: grand >= 500,
    },
    {
      id: 'balanced',
      title: 'Three level weeks in a row',
      caption:
        run >= 3 ? `${run} in a row` : run > 0 ? `${run} of 3 so far` : 'A level week starts one',
      achieved: run >= 3,
    },
    {
      id: 'mental',
      title: 'Mental load seen',
      caption:
        mentalPctA === null
          ? 'Log some planning and remembering'
          : Math.abs(mentalPctA - 50) <= 15
            ? 'Shared within 15% — noticed and split'
            : `Currently ${Math.max(mentalPctA, 100 - mentalPctA)}% on one side`,
      achieved: mentalPctA !== null && Math.abs(mentalPctA - 50) <= 15,
    },
    {
      id: 'weeks',
      title: 'Eight weeks logged together',
      caption:
        closed.length >= 8 ? `${closed.length} weeks in` : `${closed.length} of 8 so far`,
      achieved: closed.length >= 8,
    },
  ]
}

/** The chore that carried the week — highest count × points across both. */
export function choreOfTheWeek(
  rows: { choreId: string; count: number; points: number; week: string }[],
  week: string,
  nameOf: (id: string) => string,
) {
  const byChore = new Map<string, { times: number; pts: number }>()
  for (const r of rows) {
    if (r.week !== week || !r.count) continue
    const cur = byChore.get(r.choreId) ?? { times: 0, pts: 0 }
    cur.times += r.count
    cur.pts += r.count * r.points
    byChore.set(r.choreId, cur)
  }
  let best: { id: string; times: number; pts: number } | null = null
  for (const [id, v] of byChore) {
    if (!best || v.pts > best.pts) best = { id, ...v }
  }
  return best ? { name: nameOf(best.id), times: best.times, pts: best.pts } : null
}

/** The closing line. Warm, never congratulatory about someone winning. */
export function kindLine(level: boolean, mentalLopsided: boolean): string {
  if (mentalLopsided)
    return 'The noticing got noticed. That is the whole point of this.'
  if (level) return 'A level week — carried together, seen together.'
  return 'Every point here is work the house never says thank you for. Consider it said.'
}
