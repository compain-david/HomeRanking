import { useState } from 'react'
import type { History } from './useSync'
import type { EditableChore } from './useChores'
import { exportCsv } from './backup'
import { milestonesOf } from './milestones'

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

  const rows = history?.rows ?? []
  const dimOf = new Map(chores.map((c) => [c.id, c]))

  // All-time Effort/Aversion/Mental per person, derived from each chore's
  // current dimensions. Exact while scores are unchanged, approximate after a
  // retune — better than inventing a breakdown the stored rows never carried.
  const mix = { alix: { e: 0, a: 0, m: 0 }, david: { e: 0, a: 0, m: 0 } }
  for (const r of rows) {
    const c = dimOf.get(r.choreId)
    if (!c) continue
    mix[r.person].e += c.effort * r.count
    mix[r.person].a += c.aversion * r.count
    mix[r.person].m += c.mentalLoad * r.count
  }
  const mSum = mix.alix.m + mix.david.m
  const mentalPctA = mSum ? Math.round((mix.alix.m / mSum) * 100) : null

  const past = (history?.weeks ?? []).filter((w) => w.week !== currentWeek)
  const heaviestWeek = Math.max(...past.map((w) => w.alix + w.david), 1)
  const milestones = milestonesOf(history?.weeks ?? [], totals, mentalPctA)

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
      <div className="hdr">
        <span className="hdr-pill glass" style={{ justifyContent: 'center' }}>
          Since the beginning
        </span>
        <button className="hdr-btn glass" onClick={onClose} aria-label="Back to this week">
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <div className="lede">
        <h1 className="lede-title">
          Every week, <em>added up.</em>
        </h1>
      </div>

      <section className="hero glass">
        <div className="hero-totals">
          <div className="hero-side" data-side="left">
            <span className="hero-name">Alix</span>
            <span className="hero-num" data-who="alix" style={{ fontSize: 44 }}>
              {totals.alix}
            </span>
          </div>
          <span className="hero-chip">
            {!grand
              ? 'nothing yet'
              : Math.abs(pctA - 50) <= 10
                ? 'even, all time'
                : `${pctA > 50 ? 'Alix' : 'David'} ahead`}
          </span>
          <div className="hero-side" data-side="right">
            <span className="hero-name">David</span>
            <span className="hero-num" data-who="david" style={{ fontSize: 44 }}>
              {totals.david}
            </span>
          </div>
        </div>

        {grand > 0 && (
          <>
            <div className="mixlegend">
              {(['e', 'a', 'm'] as const).map((k) => (
                <span className="legend-item" key={k}>
                  <span className="legend-swatch" data-dim={k} />
                  {k === 'e' ? 'effort' : k === 'a' ? 'aversion' : 'mental'}
                </span>
              ))}
            </div>

            {(['alix', 'david'] as const).map((who) => {
              const m = mix[who]
              const sum = m.e + m.a + m.m || 1
              const scale = (totals[who] / heaviest) * 100
              return (
                <div
                  className="mixrow"
                  key={who}
                  style={{ '--who': `var(--${who})` } as React.CSSProperties}
                >
                  <span className="compare-name">{who === 'alix' ? 'Alix' : 'David'}</span>
                  <span className="compare-track">
                    <span className="compare-bar" style={{ width: `${scale}%` }}>
                      {(['e', 'a', 'm'] as const).map((k) => (
                        <span
                          key={k}
                          className="split-seg"
                          data-dim={k}
                          style={{ width: `${(m[k] / sum) * 100}%` }}
                        />
                      ))}
                    </span>
                  </span>
                  <span className="mixlabel">
                    E {Math.round((m.e / sum) * 100)}% · A {Math.round((m.a / sum) * 100)}% · M{' '}
                    {Math.round((m.m / sum) * 100)}%
                  </span>
                </div>
              )
            })}

            <p className="hero-insight" data-flag={mentalPctA !== null && Math.abs(mentalPctA - 50) >= 8 ? 'warn' : 'calm'}>
              {mentalPctA === null
                ? 'No mental load logged yet.'
                : Math.abs(pctA - 50) <= 10 && Math.abs(mentalPctA - 50) >= 8
                  ? `The totals have stayed even, but ${mentalPctA > 50 ? 'Alix' : 'David'} has carried ${Math.max(mentalPctA, 100 - mentalPctA)}% of the mental load all along.`
                  : Math.abs(mentalPctA - 50) <= 8
                    ? 'Mental load has stayed close to evenly shared.'
                    : `${mentalPctA > 50 ? 'Alix' : 'David'} has carried ${Math.max(mentalPctA, 100 - mentalPctA)}% of the mental load.`}
            </p>
          </>
        )}
      </section>

      <div className="sectionlabel">
        <span>Together — milestones</span>
      </div>
      {milestones.map((ms) => (
        <div className="msrow glass" key={ms.id} data-done={ms.achieved}>
          <span className="msbadge" aria-hidden="true">
            {ms.achieved ? '✓' : '·'}
          </span>
          <div className="msbody">
            <span className="recap-card-title">{ms.title}</span>
            <span className="recap-card-note">{ms.caption}</span>
          </div>
        </div>
      ))}

      {past.length > 0 && (
        <>
          <div className="sectionlabel" style={{ marginTop: 22 }}>
            <span>Week by week</span>
            <em>widths compare across weeks</em>
          </div>
          {past.map((w) => {
            const t = w.alix + w.david
            const a = t ? (w.alix / t) * 100 : 50
            const lead = Math.round((Math.max(w.alix, w.david) / (t || 1)) * 100)
            return (
              <div className="wkcard glass" key={w.week}>
                <div className="wkcard-top">
                  <span className="wkcard-label">{fmtWeek(w.week)}</span>
                  <span className="wkcard-total">{t} pts</span>
                </div>
                <span className="wkcard-track">
                  <span className="wkcard-bar" style={{ width: `${(t / heaviestWeek) * 100}%` }}>
                    <span className="weekrow-a" style={{ width: `${a}%` }} />
                    <span className="weekrow-d" style={{ width: `${100 - a}%` }} />
                  </span>
                </span>
                <span className="wkcard-verdict">
                  {lead <= 55
                    ? 'an even week'
                    : `${w.alix > w.david ? 'Alix' : 'David'} carried ${lead}%`}
                </span>
              </div>
            )
          })}
        </>
      )}

      <JournalSection history={history} chores={chores} />

      <div className="sectionlabel" style={{ marginTop: 22 }}>
        <span>Who does what</span>
        <em>Alix / David</em>
      </div>
      {ranked.length === 0 ? (
        <p className="footer-note">Nothing logged yet.</p>
      ) : (
        ranked.map((c) => (
          <div className="whorow" key={c.id}>
            <span className="tallyrow-name">{c.name}</span>
            <span className="tallyrow-split" aria-hidden="true">
              <span className="tallyrow-a" style={{ width: `${(c.alix / c.times) * 100}%` }} />
              <span className="tallyrow-d" style={{ width: `${(c.david / c.times) * 100}%` }} />
            </span>
            <span className="tallyrow-counts">
              <span className="tallyrow-count" data-who="alix" data-zero={c.alix === 0}>
                {c.alix}
              </span>
              <span className="tallyrow-slash">/</span>
              <span className="tallyrow-count" data-who="david" data-zero={c.david === 0}>
                {c.david}
              </span>
            </span>
          </div>
        ))
      )}
    </div>
  )
}

/**
 * Grouped by week rather than a flat list. A journal of individual rows makes
 * you reconstruct the week in your head; the week is the unit the app actually
 * thinks in, so it is the unit worth reading.
 */
function JournalSection({
  history,
  chores,
}: {
  history: History | null
  chores: EditableChore[]
}) {
  const [open, setOpen] = useState<string | null>(null)
  const rows = history?.rows ?? []
  if (!rows.length) return null

  const nameOf = new Map(chores.map((c) => [c.id, c.name]))

  const weeks = new Map<
    string,
    { alix: number; david: number; items: { name: string; person: string; count: number; pts: number }[] }
  >()
  for (const r of rows) {
    if (!r.count) continue
    const w = weeks.get(r.week) ?? { alix: 0, david: 0, items: [] }
    const pts = r.count * r.points
    w[r.person] += pts
    w.items.push({
      name: nameOf.get(r.choreId) ?? r.choreId,
      person: r.person,
      count: r.count,
      pts,
    })
    weeks.set(r.week, w)
  }

  const ordered = [...weeks.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  // newest week starts open — it is the one you came to look at
  const current = open ?? ordered[0]?.[0]

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

      {ordered.map(([week, w]) => {
        const isOpen = current === week
        const total = w.alix + w.david
        return (
          <div className="jweek" key={week}>
            <button
              className="jweek-head"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? '' : week)}
            >
              <span className="jweek-label">{fmtWeek(week)}</span>
              <span className="jweek-split">
                <span style={{ color: 'var(--alix)' }}>{w.alix}</span>
                <span className="tallyrow-slash">/</span>
                <span style={{ color: 'var(--david)' }}>{w.david}</span>
              </span>
              <span className="jweek-total">{total} pts</span>
              <span className="caret" data-open={isOpen} />
            </button>

            {isOpen && (
              <div className="jweek-body">
                {w.items
                  .sort((a, b) => b.pts - a.pts)
                  .map((it, i) => (
                    <div className="jitem" key={`${week}-${it.name}-${it.person}-${i}`}>
                      <span className="jitem-who" data-who={it.person}>
                        {it.person === 'alix' ? 'A' : 'D'}
                      </span>
                      <span className="journalrow-name">{it.name}</span>
                      <span className="jitem-count">×{it.count}</span>
                      <span className="jitem-pts">{it.pts}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}
