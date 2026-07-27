import type { EditableChore } from './useChores'
import type { History } from './useSync'

export type Backup = {
  app: 'homeranking'
  version: 1
  exportedAt: string
  chores: EditableChore[]
  weeks: Record<string, { alix: Record<string, number>; david: Record<string, number> }>
}

const download = (name: string, mime: string, body: string) => {
  const url = URL.createObjectURL(new Blob([body], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

/** Every week held on this device, plus the chore list, as one JSON file. */
export function exportBackup(chores: EditableChore[]) {
  const weeks: Backup['weeks'] = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith('homeranking:v1:')) continue
    try {
      weeks[key.slice('homeranking:v1:'.length)] = JSON.parse(localStorage.getItem(key)!)
    } catch {
      /* skip an unreadable week rather than losing the file */
    }
  }
  const backup: Backup = {
    app: 'homeranking',
    version: 1,
    exportedAt: new Date().toISOString(),
    chores,
    weeks,
  }
  download(`homeranking-${new Date().toISOString().slice(0, 10)}.json`, 'application/json', JSON.stringify(backup, null, 2))
}

export async function importBackup(file: File): Promise<Backup> {
  const parsed = JSON.parse(await file.text()) as Backup
  if (parsed?.app !== 'homeranking' || !parsed.weeks) {
    throw new Error('That file is not a HomeRanking backup.')
  }
  for (const [week, counts] of Object.entries(parsed.weeks)) {
    localStorage.setItem(`homeranking:v1:${week}`, JSON.stringify(counts))
  }
  return parsed
}

const csvCell = (v: string | number) => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * One row per person per chore per week — the same granularity the database
 * stores, so a spreadsheet can pivot it however you like.
 */
export function exportCsv(history: History, chores: EditableChore[]) {
  const nameOf = new Map(chores.map((c) => [c.id, c.name]))
  const catOf = new Map(chores.map((c) => [c.id, c.category]))

  const rows = [['week', 'person', 'category', 'chore', 'times', 'points_each', 'points_total'].join(',')]
  for (const r of [...history.rows].sort(
    (a, b) => a.week.localeCompare(b.week) || a.person.localeCompare(b.person),
  )) {
    rows.push(
      [
        r.week,
        r.person === 'alix' ? 'Alix' : 'David',
        catOf.get(r.choreId) ?? '',
        nameOf.get(r.choreId) ?? r.choreId,
        r.count,
        r.points,
        r.count * r.points,
      ]
        .map(csvCell)
        .join(','),
    )
  }
  download(
    `homeranking-${new Date().toISOString().slice(0, 10)}.csv`,
    'text/csv;charset=utf-8',
    rows.join('\n'),
  )
}
