import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ALL_CHORES, CATEGORIES, points, type Chore } from './data/chores'
import { daysLeft, weekKey, weekLabel } from './week'

/* ---------------- people ---------------- */

const PEOPLE = [
  { id: 'alix', name: 'Alix', varName: 'var(--alix)' },
  { id: 'david', name: 'David', varName: 'var(--david)' },
] as const

type PersonId = (typeof PEOPLE)[number]['id']

/* ---------------- persistence ---------------- */

type Counts = Record<PersonId, Record<string, number>>

const EMPTY: Counts = { alix: {}, david: {} }
const storageKey = (wk: string) => `homeranking:v1:${wk}`

function loadCounts(wk: string): Counts {
  try {
    const raw = localStorage.getItem(storageKey(wk))
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<Counts>
    return { alix: parsed.alix ?? {}, david: parsed.david ?? {} }
  } catch {
    return EMPTY
  }
}

/* ---------------- the total, counting up ---------------- */

function useCountUp(target: number, ms = 480): number {
  const [shown, setShown] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      fromRef.current = target
      setShown(target)
      return
    }
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(Math.round(from + (target - from) * eased))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, ms])

  return shown
}

/* ---------------- small pieces ---------------- */

function Ticks({ chore }: { chore: Chore }) {
  const dims: Array<[string, number]> = [
    ['e', chore.effort],
    ['a', chore.aversion],
    ['m', chore.mentalLoad],
  ]
  return (
    <span className="ticks" aria-hidden="true">
      {dims.map(([dim, v]) => (
        <span key={dim} className="tick" data-dim={dim} style={{ height: `${2 + v * 1.6}px` }} />
      ))}
    </span>
  )
}

function Row({
  chore,
  count,
  onBump,
}: {
  chore: Chore
  count: number
  onBump: (delta: number) => void
}) {
  const [pulse, setPulse] = useState(false)
  const p = points(chore)

  const bump = (delta: number) => {
    onBump(delta)
    if (delta > 0) {
      setPulse(false)
      requestAnimationFrame(() => setPulse(true))
    }
  }

  return (
    <div className="row" data-done={count > 0}>
      {/* the whole left side logs the chore, so the tap target is the row */}
      <button className="row-hit" onClick={() => bump(1)} aria-label={`Log ${chore.name}`}>
        <span className="row-name">{chore.name}</span>
        <span className="row-meta">
          <Ticks chore={chore} />
          <span className="row-pts">{p} pts</span>
          <span className="row-target">target {chore.target}</span>
        </span>
      </button>
      <div className="stepper">
        <button
          className="step"
          onClick={() => bump(-1)}
          disabled={count === 0}
          aria-label={`One fewer ${chore.name}`}
        >
          −
        </button>
        <span
          className={`count${pulse ? ' pulse' : ''}`}
          data-any={count > 0}
          onAnimationEnd={() => setPulse(false)}
        >
          {count}
        </span>
        <button className="step step-plus" onClick={() => bump(1)} aria-label={`Log ${chore.name}`}>
          +
        </button>
      </div>
    </div>
  )
}

/* ---------------- app ---------------- */

export default function App() {
  const wk = weekKey()
  const [counts, setCounts] = useState<Counts>(() => loadCounts(wk))
  const [who, setWho] = useState<PersonId>('alix')
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CATEGORIES.map((c, i) => [c.name, i === 0])),
  )
  const [compact, setCompact] = useState(false)
  // clearing is reversible rather than confirmed: a dialog interrupts, an undo
  // costs nothing and is still there if the tap was a mistake
  const [undo, setUndo] = useState<Counts | null>(null)

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 64)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    localStorage.setItem(storageKey(wk), JSON.stringify(counts))
  }, [counts, wk])

  const bump = useCallback(
    (person: PersonId, choreId: string, delta: number) => {
      setCounts((prev) => {
        const next = Math.max(0, (prev[person][choreId] ?? 0) + delta)
        return { ...prev, [person]: { ...prev[person], [choreId]: next } }
      })
    },
    [],
  )

  const totals = useMemo(() => {
    const of = (person: PersonId) => {
      let total = 0
      let e = 0
      let a = 0
      let m = 0
      let done = 0
      for (const c of ALL_CHORES) {
        const n = counts[person][c.id] ?? 0
        if (!n) continue
        done += n
        total += n * points(c)
        e += n * c.effort
        a += n * c.aversion
        m += n * c.mentalLoad
      }
      return { total, e, a, m, done }
    }
    return { alix: of('alix'), david: of('david') }
  }, [counts])

  const active = totals[who]
  const assigned = totals.alix.total + totals.david.total
  const pctA = assigned ? Math.round((totals.alix.total / assigned) * 100) : 50
  const gap = Math.abs(totals.alix.total - totals.david.total)
  // each arm is drawn relative to the heavier side, so the leader fills its
  // half and the balance reads as two arms off a fulcrum
  const heaviest = Math.max(totals.alix.total, totals.david.total, 1)
  const armA = (totals.alix.total / heaviest) * 100
  const armD = (totals.david.total / heaviest) * 100
  const level = assigned > 0 && Math.abs(pctA - 50) <= 5

  const shownTotal = useCountUp(active.total)
  const person = PEOPLE.find((p) => p.id === who)!
  const style = { '--who': person.varName } as React.CSSProperties

  const state = !assigned ? 'empty' : level ? 'level' : 'tilt'
  const heavier = totals.alix.total > totals.david.total ? 'Alix' : 'David'
  const lighter = heavier === 'Alix' ? 'David' : 'Alix'

  const verdict =
    state === 'empty'
      ? 'Nothing logged yet. Tap + on anything you have done.'
      : state === 'level'
        ? `An even split, with ${daysLeft()} ${daysLeft() === 1 ? 'day' : 'days'} left in the week.`
        : `${heavier} is carrying ${Math.max(pctA, 100 - pctA)}%. About ${Math.round(gap / 2)} points would move to ${lighter} to level it.`

  // The headline total can read level while the experience is not: one
  // person's points can be mostly effort and the other's mostly mental load.
  // This is the comparison the app exists to surface.
  const mlTotal = totals.alix.m + totals.david.m
  const mlPctA = mlTotal ? Math.round((totals.alix.m / mlTotal) * 100) : 50
  // 60/40 and beyond is worth naming: when the totals are level, that gap is
  // precisely the asymmetry the headline number cannot show
  const mlLopsided = mlTotal > 0 && Math.abs(mlPctA - 50) >= 10
  const mlHeavier = mlPctA > 50 ? 'Alix' : 'David'
  const mlShare = Math.max(mlPctA, 100 - mlPctA)

  const insight: { text: string; flag: 'warn' | 'calm' } | null = !assigned
    ? null
    : mlLopsided && level
      ? {
          flag: 'warn',
          text: `The totals are level, but ${mlHeavier} is carrying ${mlShare}% of the mental load — the noticing and remembering, which the total does not show.`,
        }
      : mlLopsided
        ? {
            flag: 'warn',
            text: `${mlHeavier} is carrying ${mlShare}% of the mental load this week.`,
          }
        : { flag: 'calm', text: 'Mental load is split fairly evenly this week.' }

  return (
    <div className="app" style={style}>
      <header className="panel" data-compact={compact}>
        <div className="masthead">
          <div className="wordmark">
            Home<span>Ranking</span>
          </div>
          <div className="weekstamp">{weekLabel()}</div>
        </div>

        <div className="tabs" role="tablist" aria-label="Whose list">
          {PEOPLE.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={who === p.id}
              className="tab"
              data-on={who === p.id}
              style={{ '--who': p.varName } as React.CSSProperties}
              onClick={() => setWho(p.id)}
            >
              <span className="tab-name">{p.name}</span>
              <span className="tab-pts">{totals[p.id].total} pts</span>
            </button>
          ))}
        </div>

        <div className="readout">
          <div>
            <div className="readout-total" aria-live="polite" aria-atomic="true">
              {shownTotal}
            </div>
            <span className="readout-label">points this week</span>
          </div>
          <div className="readout-side">
            <div className="readout-done">
              {active.done} {active.done === 1 ? 'chore' : 'chores'}
            </div>
          </div>
        </div>

        <div className="beam">
          <div
            className="beam-track"
            role="img"
            aria-label={`Balance: Alix ${pctA} percent, David ${100 - pctA} percent`}
          >
            <div className="beam-pan" data-side="left">
              <div className="beam-arm" data-who="alix" style={{ width: `${armA}%` }} />
            </div>
            <div className="beam-fulcrum" />
            <div className="beam-pan" data-side="right">
              <div className="beam-arm" data-who="david" style={{ width: `${armD}%` }} />
            </div>
          </div>
          <div className="beam-verdict">
            <span className="chip" data-state={state}>
              {state === 'empty' ? 'no data' : state === 'level' ? 'balanced' : `${heavier} +${gap}`}
            </span>
            <span>{verdict}</span>
          </div>
        </div>
      </header>

      <section className="compare">
        <div className="compare-head">
          <span className="split-title">What the points are made of</span>
          <span className="compare-legend" aria-hidden="true">
            {(['e', 'a', 'm'] as const).map((dim) => (
              <span className="legend-item" key={dim}>
                <span className="legend-swatch" data-dim={dim} />
                {dim === 'e' ? 'Effort' : dim === 'a' ? 'Aversion' : 'Mental'}
              </span>
            ))}
          </span>
        </div>

        {PEOPLE.map((pp) => {
          const t = totals[pp.id]
          const sum = t.e + t.a + t.m || 1
          // bars are scaled against the heavier person, so their lengths
          // compare directly instead of both filling the width
          const scale = (t.total / heaviest) * 100
          return (
            <div
              className="compare-row"
              key={pp.id}
              style={{ '--who': pp.varName } as React.CSSProperties}
            >
              <span className="compare-name">{pp.name}</span>
              <span className="compare-track">
                <span className="compare-bar" style={{ width: `${scale}%` }}>
                  {(['e', 'a', 'm'] as const).map((dim) => (
                    <span
                      key={dim}
                      className="split-seg"
                      data-dim={dim}
                      style={{ width: `${((dim === 'e' ? t.e : dim === 'a' ? t.a : t.m) / sum) * 100}%` }}
                    />
                  ))}
                </span>
              </span>
              <span className="compare-total">{t.total}</span>
            </div>
          )
        })}

        {insight && (
          <p className="insight" data-flag={insight.flag}>
            {insight.text}
          </p>
        )}
      </section>

      {CATEGORIES.map((cat) => {
        const logged = cat.chores.reduce((s, c) => s + (counts[who][c.id] ?? 0), 0)
        const target = cat.chores.reduce((s, c) => s + c.target, 0)
        const isOpen = open[cat.name]
        return (
          <section className="cat" key={cat.name}>
            <button
              className="cat-head"
              aria-expanded={isOpen}
              onClick={() => setOpen((o) => ({ ...o, [cat.name]: !o[cat.name] }))}
            >
              <span className="cat-emoji">{cat.emoji}</span>
              <span className="cat-name">{cat.name}</span>
              <span className="cat-count" data-any={logged > 0}>
                {logged} / {Math.round(target)}
              </span>
              <span className="caret" data-open={isOpen} />
            </button>
            {isOpen && (
              <div className="cat-body">
                {cat.chores.map((c) => (
                  <Row
                    key={c.id}
                    chore={c}
                    count={counts[who][c.id] ?? 0}
                    onBump={(d) => bump(who, c.id, d)}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}

      <footer className="footer">
        <p className="footer-note">
          Saved on this device only. The week resets after Sunday.
        </p>
        {undo ? (
          <button className="ghost" data-undo="true" onClick={() => { setCounts(undo); setUndo(null) }}>
            Undo clear
          </button>
        ) : (
          <button className="ghost" onClick={() => { setUndo(counts); setCounts(EMPTY) }}>
            Clear week
          </button>
        )}
      </footer>
    </div>
  )
}
