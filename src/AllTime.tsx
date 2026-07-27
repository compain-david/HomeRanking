import { useState } from 'react'
import type { History } from './useSync'
import type { EditableChore } from './useChores'
import { exportCsv } from './backup'

const PEOPLE = [
  { id: 'alix', name: 'Alix', varName: 'var(--alix)' },
  { id: 'david', name: 'David', varName: 'var(--david)' },
] as const

const fmtWeek = (iso: string) => {
  const d = new Date(iso + 'T00:00:00')
  const end = new Date(d)
  end.setDate(end.getDate() + 6)
  const f = (x: Date) => x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${f(d)} – ${f(end)}`
}

export default function AllTime({
  history,
  chores,
  currentWeek,
  onClose,
}: {
  history: History | null
  chores: EditableChore[]
  currentWeek: string
  onClose: () => void
}) {
  const totals = history?.totals ?? { alix: 0, david: 0 }
  const grand = totals.alix + totals.david
  const heaviest = Math.max(totals.alix, totals.david, 1)
  const pctA = grand ? Math.round((totals.alix / grand) * 100) : 50

  const past = (history?.weeks ?? []).filter((w) => w.week !== currentWeek)
  const done = history?.perChore ?? {}
  const ranked = chores
    .map((c) => {
      const t = done[c.id] ?? { alix: 0, david: 0 }
      return { ...c, alix: t.alix, david: t.david, times: t.alix + t.david }
    })
    .filter((c) => c.times > 0)
    .sort((a, b) => b.times - a.times)

  return (
    <div className="alltime">
      <header className="settings-head">
        <div>
          <h1 className="settings-title">Since the beginning</h1>
          <p className="settings-sub">
            Every week you have logged, added up. The weekly view resets; this does not.
          </p>
        </div>
        <button className="ghost" onClick={onClose}>
          Done
        </button>
      </header>

      <section className="compare">
        <div className="compare-head">
          <span className="split-title">Total load carried</span>
          <span className="split-note">{grand} pts</span>
        </div>
        {PEOPLE.map((p) => (
          <div
            className="compare-row"
            key={p.id}
            style={{ '--who': p.varName } as React.CSSProperties}
          >
            <span className="compare-name">{p.name}</span>
            <span className="compare-track">
              <span
                className="compare-bar"
                style={{ width: `${(totals[p.id] / heaviest) * 100}%`, background: p.varName }}
              />
            </span>
            <span className="compare-total">{totals[p.id]}</span>
          </div>
        ))}
        {grand > 0 && (
          <p className="insight" data-flag={Math.abs(pctA - 50) > 10 ? 'warn' : 'calm'}>
            {Math.abs(pctA - 50) <= 10
              ? 'Across every week logged, the split has stayed close to even.'
              : `Across every week logged, ${pctA > 50 ? 'Alix' : 'David'} has carried ${Math.max(pctA, 100 - pctA)}% of the load.`}
          </p>
        )}
      </section>

      {past.length > 0 && (
        <section className="settings-cat">
          <div className="settings-cat-head">
            <span className="cat-name">Week by week</span>
          </div>
          {past.map((w) => {
            const t = w.alix + w.david
            const a = t ? (w.alix / t) * 100 : 50
            return (
              <div className="weekrow" key={w.week}>
                <span className="weekrow-label">{fmtWeek(w.week)}</span>
                <span className="weekrow-bar">
                  <span className="weekrow-a" style={{ width: `${a}%` }} />
                  <span className="weekrow-d" style={{ width: `${100 - a}%` }} />
                </span>
                <span className="weekrow-total">{t}</span>
              </div>
            )
          })}
        </section>
      )}

      <JournalSection history={history} chores={chores} />

      <section className="settings-cat">
        <div className="settings-cat-head">
          <span className="cat-name">Who has done what, how often</span>
          <span className="tally-key">
            <span className="tally-key-item" data-who="alix">Alix</span>
            <span className="tally-key-item" data-who="david">David</span>
          </span>
        </div>
        {ranked.length === 0 ? (
          <p className="footer-note">Nothing logged yet.</p>
        ) : (
          ranked.map((c) => (
            <div className="tallyrow" key={c.id}>
              <span className="tallyrow-name">{c.name}</span>
              <span className="tallyrow-split" aria-hidden="true">
                <span className="tallyrow-a" style={{ width: `${(c.alix / c.times) * 100}%` }} />
                <span className="tallyrow-d" style={{ width: `${(c.david / c.times) * 100}%` }} />
              </span>
              <span className="tallyrow-counts">
                <span
                  className="tallyrow-count"
                  data-who="alix"
                  data-zero={c.alix === 0}
                  title={`Alix ${c.alix}`}
                >
                  {c.alix}
                </span>
                <span className="tallyrow-slash">/</span>
                <span
                  className="tallyrow-count"
                  data-who="david"
                  data-zero={c.david === 0}
                  title={`David ${c.david}`}
                >
                  {c.david}
                </span>
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  )
}

/**
 * The counters are weekly, not timestamped, so this cannot pretend to be a
 * minute-by-minute feed. It is the honest thing instead: every entry, newest
 * week first, exactly as stored.
 */
function JournalSection({
  history,
  chores,
}: {
  history: History | null
  chores: EditableChore[]
}) {
  const [expanded, setExpanded] = useState(false)
  const rows = (history?.rows ?? [])
    .slice()
    .sort((a, b) => b.week.localeCompare(a.week) || b.count - a.count)
  if (!rows.length) return null

  const nameOf = new Map(chores.map((c) => [c.id, c.name]))
  const shown = expanded ? rows : rows.slice(0, 8)

  return (
    <section className="settings-cat">
      <div className="settings-cat-head">
        <span className="cat-name">Journal</span>
        <button
          className="ghost"
          onClick={() => history && exportCsv(history, chores)}
          style={{ marginLeft: 'auto' }}
        >
          Export CSV
        </button>
      </div>

      {shown.map((r, i) => (
        <div className="journalrow" key={`${r.week}-${r.person}-${r.choreId}-${i}`}>
          <span className="journalrow-week">{r.week.slice(5)}</span>
          <span className="journalrow-who" data-who={r.person}>
            {r.person === 'alix' ? 'Alix' : 'David'}
          </span>
          <span className="journalrow-name">{nameOf.get(r.choreId) ?? r.choreId}</span>
          <span className="journalrow-count">
            {r.count}× · {r.count * r.points}
          </span>
        </div>
      ))}

      {rows.length > 8 && (
        <button className="add-chore" onClick={() => setExpanded((e) => !e)}>
          {expanded ? 'Show less' : `Show all ${rows.length} entries`}
        </button>
      )}
    </section>
  )
}
