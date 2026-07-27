import type { History } from './useSync'
import type { EditableChore } from './useChores'

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
    .map((c) => ({ ...c, times: done[c.id] ?? 0 }))
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

      <section className="settings-cat">
        <div className="settings-cat-head">
          <span className="cat-name">How often each chore has been done</span>
        </div>
        {ranked.length === 0 ? (
          <p className="footer-note">Nothing logged yet.</p>
        ) : (
          ranked.map((c) => (
            <div className="tallyrow" key={c.id}>
              <span className="tallyrow-name">{c.name}</span>
              <span className="tallyrow-count">
                {c.times}
                <small>×</small>
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
