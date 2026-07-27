import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { points, type Chore } from './data/chores'
import { daysLeft, weekKey, weekLabel } from './week'
import { EMPTY_COUNTS, useSync, type Counts, type PersonId } from './useSync'
import SCHEMA_SQL from '../supabase/schema.sql?raw'
import Recap from './Recap'
import { monthKey, monthName, monthOf, streakOf } from './close'

const Settings = lazy(() => import('./Settings'))
const AllTime = lazy(() => import('./AllTime'))
import { CATEGORY_EMOJI, CATEGORY_NAMES, useChores } from './useChores'

const PROJECT = 'jasildjjlncoriepjosp'
const SQL_EDITOR = `https://supabase.com/dashboard/project/${PROJECT}/sql/new`
const AUTH_PROVIDERS = `https://supabase.com/dashboard/project/${PROJECT}/auth/providers`

/* ---------------- people ---------------- */

const PEOPLE = [
  { id: 'alix', name: 'Alix', varName: 'var(--alix)' },
  { id: 'david', name: 'David', varName: 'var(--david)' },
] as const

/* ---------------- persistence ---------------- */

const EMPTY = EMPTY_COUNTS
const storageKey = (wk: string) => `homeranking:v1:${wk}`

/**
 * Past weeks are already sitting in local storage under their own keys — they
 * were just never read back. This makes the all-time view work before, and
 * without, any connection.
 */
function localHistory(pointsOf: (id: string) => number) {
  const weeks: { week: string; alix: number; david: number }[] = []
  const totals = { alix: 0, david: 0 }
  const perChore: Record<string, { alix: number; david: number }> = {}
  const rows: import('./useSync').HistoryRow[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith('homeranking:v1:')) continue
    try {
      const parsed = JSON.parse(localStorage.getItem(key)!) as Counts
      const week = key.slice('homeranking:v1:'.length)
      const row = { week, alix: 0, david: 0 }
      for (const person of ['alix', 'david'] as PersonId[]) {
        for (const [id, n] of Object.entries(parsed[person] ?? {})) {
          if (!n) continue
          row[person] += pointsOf(id) * n
          const tally = (perChore[id] ??= { alix: 0, david: 0 })
          tally[person] += n
          rows.push({ week, person, choreId: id, count: n, points: pointsOf(id) })
        }
      }
      totals.alix += row.alix
      totals.david += row.david
      if (row.alix || row.david) weeks.push(row)
    } catch {
      /* skip an unreadable week rather than losing the rest */
    }
  }
  weeks.sort((a, b) => b.week.localeCompare(a.week))
  return { rows, weeks, totals, perChore }
}

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
        <span className="row-name">
          {(chore as { emoji?: string }).emoji ? (
            <span className="row-emoji">{(chore as { emoji?: string }).emoji}</span>
          ) : null}
          {chore.name}
        </span>
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
    Object.fromEntries(CATEGORY_NAMES.map((n, i) => [n, i === 0])),
  )
  // clearing is reversible rather than confirmed: a dialog interrupts, an undo
  // costs nothing and is still there if the tap was a mistake
  const [undo, setUndo] = useState<Counts | null>(null)

  useEffect(() => {
    localStorage.setItem(storageKey(wk), JSON.stringify(counts))
  }, [counts, wk])

  const [chorePoints, setChorePoints] = useState<Record<string, number>>({})
  const sync = useSync(wk, counts, setCounts, (id) => chorePoints[id] ?? 0)
  const choreApi = useChores(sync.household?.id ?? null)

  // the sync layer needs current scores to freeze them onto each write
  useEffect(() => {
    setChorePoints(
      Object.fromEntries(choreApi.chores.map((c) => [c.id, c.effort + c.aversion + c.mentalLoad])),
    )
  }, [choreApi.chores])
  const [view, setView] = useState<'week' | 'all' | 'settings'>('week')
  const [q, setQ] = useState('')
  const [dim, setDim] = useState<'e' | 'a' | 'm' | null>(null)

  const hist = useMemo(
    () => sync.history ?? localHistory((id) => chorePoints[id] ?? 0),
    [sync.history, chorePoints, counts],
  )

  // Last completed week, shown once at the start of the new one.
  const [recapSeen, setRecapSeen] = useState<string | null>(() =>
    localStorage.getItem('homeranking:recapSeen'),
  )
  const lastWeek = useMemo(
    () => hist.weeks.filter((w) => w.week < wk).sort((a, b) => b.week.localeCompare(a.week))[0],
    [hist.weeks, wk],
  )
  const showRecap = !!lastWeek && recapSeen !== lastWeek.week

  const streak = useMemo(() => streakOf(hist.weeks, wk), [hist.weeks, wk])
  const month = useMemo(() => monthOf(hist.weeks, monthKey()), [hist.weeks])

  // What this person reaches for most, pinned above the categories. Ranked on
  // history rather than this week, so the shortcut is there on Monday morning
  // when the week is still empty — which is exactly when scrolling hurts most.
  const usual = useMemo(() => {
    const live = counts[who]
    const scored = choreApi.chores
      .filter((c) => c.active && c.name.trim())
      .map((c) => ({
        chore: c,
        rank: (hist.perChore[c.id]?.[who] ?? 0) + (live[c.id] ?? 0) * 0.5,
      }))
      .filter((x) => x.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 5)
    // one or two entries is not a shortcut, it is noise
    return scored.length >= 3 ? scored.map((x) => x.chore) : []
  }, [hist, choreApi.chores, who, counts])

  // only chores that are switched on, grouped the way the list is drawn
  const groups = useMemo(
    () =>
      CATEGORY_NAMES.map((name) => ({
        name,
        emoji: CATEGORY_EMOJI[name],
        chores: choreApi.chores
          .filter((c) => c.category === name && c.active && c.name.trim())
          .sort((a, b) => a.sortOrder - b.sortOrder),
      })).filter((g) => g.chores.length),
    [choreApi.chores],
  )

  const bump = useCallback(
    (person: PersonId, choreId: string, delta: number) => {
      setCounts((prev) => {
        const next = Math.max(0, (prev[person][choreId] ?? 0) + delta)
        // the tap lands locally first; the write follows and queues if offline
        sync.push(person, choreId, next)
        return { ...prev, [person]: { ...prev[person], [choreId]: next } }
      })
    },
    [sync],
  )

  const totals = useMemo(() => {
    const of = (person: PersonId) => {
      let total = 0
      let e = 0
      let a = 0
      let m = 0
      let done = 0
      for (const c of choreApi.chores) {
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
  }, [counts, choreApi.chores])

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
  // one flat list while searching — categories are noise when you know the name
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return null
    return choreApi.chores
      .filter((c) => c.active && c.name.toLowerCase().includes(needle))
      .slice(0, 10)
  }, [q, choreApi.chores])

  const houseDims = {
    e: totals.alix.e + totals.david.e,
    a: totals.alix.a + totals.david.a,
    m: totals.alix.m + totals.david.m,
  }
  const dimSum = houseDims.e + houseDims.a + houseDims.m || 1

  // whose points a dimension mostly comes from — the note under each pill
  const carrierOf = (k: 'e' | 'a' | 'm') => {
    const a = totals.alix[k]
    const tot = a + totals.david[k]
    if (!tot) return { text: 'no data', who: null as PersonId | null }
    const pct = (a / tot) * 100
    if (Math.abs(pct - 50) < 10) return { text: 'even', who: null as PersonId | null }
    const w: PersonId = pct > 50 ? 'alix' : 'david'
    const name = w === 'alix' ? 'Alix' : 'David'
    return { text: Math.abs(pct - 50) >= 20 ? `mostly ${name}` : `more ${name}`, who: w }
  }

  // the chores actually driving a dimension, for the expanded pill
  const driversOf = (k: 'e' | 'a' | 'm') =>
    choreApi.chores
      .map((c) => {
        const dv = k === 'e' ? c.effort : k === 'a' ? c.aversion : c.mentalLoad
        const a = counts.alix[c.id] ?? 0
        const dd = counts.david[c.id] ?? 0
        return { c, a, d: dd, weight: (a + dd) * dv }
      })
      .filter((x) => x.weight > 0)
      .sort((x, y) => y.weight - x.weight)
      .slice(0, 3)

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

  if (view === 'settings') {
    return (
      <div className="app" style={style}>
        <Suspense fallback={<p className="loading">Loading…</p>}>
          <Settings api={choreApi} onClose={() => setView('week')} />
        </Suspense>
      </div>
    )
  }

  if (view === 'all') {
    return (
      <div className="app" style={style}>
        <Suspense fallback={<p className="loading">Loading…</p>}>
          <AllTime
            history={sync.history ?? localHistory((id) => chorePoints[id] ?? 0)}
            chores={choreApi.chores}
            currentWeek={wk}
            onClose={() => setView('week')}
          />
        </Suspense>
      </div>
    )
  }

  return (
    <div className="app" style={style}>
      <header className="panel">
        <div className="hdr">
          <SyncBar sync={sync} />
          <button className="hdr-btn glass" aria-label="Since the beginning" onClick={() => setView('all')}>
            <span aria-hidden="true">∑</span>
          </button>
          <button className="hdr-btn glass" aria-label="Chores and scores" onClick={() => setView('settings')}>
            <span aria-hidden="true">⚙</span>
          </button>
        </div>

        <div className="lede">
          <span className="lede-kicker">Alix &amp; David</span>
          <h1 className="lede-title">
            Who carries <em style={{ textShadow: `0 0 18px color-mix(in srgb, ${person.varName} 45%, transparent)` }}>the week?</em>
          </h1>
        </div>

        <div className="tabs" role="tablist" aria-label="Whose list">
          {PEOPLE.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={who === p.id}
              className="tab"
              data-on={who === p.id}
              data-who={p.id}
              style={{ '--who': p.varName } as React.CSSProperties}
              onClick={() => setWho(p.id)}
            >
              <span className="tab-name">{p.name}</span>
              <span className="tab-pts">{totals[p.id].total} pts</span>
            </button>
          ))}
        </div>

        <section className="hero glass">
          <div className="hero-totals">
            <div className="hero-side" data-side="left" data-active={who === 'alix'}>
              <span className="hero-name">Alix</span>
              <span className="hero-num" data-who="alix">
                {who === 'alix' ? shownTotal : totals.alix.total}
              </span>
            </div>
            <span className="hero-chip" data-tone={state === 'tilt' ? 'tilt' : 'calm'}>
              {state === 'empty' ? 'no data yet' : state === 'level' ? 'in balance' : `${heavier} +${gap}`}
            </span>
            <div className="hero-side" data-side="right" data-active={who === 'david'}>
              <span className="hero-name">David</span>
              <span className="hero-num" data-who="david">
                {who === 'david' ? shownTotal : totals.david.total}
              </span>
            </div>
          </div>

          <div
            className="beam2"
            role="img"
            aria-label={`Alix ${pctA} percent, David ${100 - pctA} percent`}
            style={{
              transform: `rotate(${Math.max(-1.4, Math.min(1.4, (totals.david.total - totals.alix.total) * 0.05))}deg)`,
            }}
          >
            <span className="beam2-side" data-side="left">
              <span className="beam2-arm" data-who="alix" style={{ width: `${armA}%` }} />
            </span>
            <span className="beam2-pivot" />
            <span className="beam2-side" data-side="right">
              <span className="beam2-arm" data-who="david" style={{ width: `${armD}%` }} />
            </span>
          </div>

          <p className="hero-verdict">{verdict}</p>

          <div className="dims">
            {(['e', 'a', 'm'] as const).map((k) => {
              const carrier = carrierOf(k)
              const lopsided = k === 'm' && mlLopsided
              return (
                <button
                  key={k}
                  className="dim"
                  data-open={dim === k}
                  data-flag={lopsided}
                  aria-expanded={dim === k}
                  style={
                    {
                      '--carrier': carrier.who === 'alix' ? 'var(--alix)' : 'var(--david)',
                    } as React.CSSProperties
                  }
                  onClick={() => setDim((cur) => (cur === k ? null : k))}
                >
                  <span className="dim-label">
                    {k === 'e' ? 'Effort' : k === 'a' ? 'Aversion' : 'Mental'}
                  </span>
                  <span className="dim-pct">{Math.round((houseDims[k] / dimSum) * 100)}%</span>
                  <span className="dim-note">{carrier.text}</span>
                </button>
              )
            })}
          </div>

          {dim && (
            <div className="dim-drill">
              <span className="drill-title">What drives it</span>
              {driversOf(dim).length === 0 ? (
                <span className="drill-counts">Nothing logged yet.</span>
              ) : (
                driversOf(dim).map((x) => (
                  <div className="drill-row" key={x.c.id}>
                    <span className="drill-name">{x.c.name}</span>
                    <span className="drill-counts">
                      Alix ×{x.a} · David ×{x.d}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {insight && (
            <p className="hero-insight" data-flag={insight.flag}>
              {insight.text}
            </p>
          )}
        </section>

      </header>

      {showRecap && lastWeek && (
        <Recap
          week={lastWeek}
          weeks={hist.weeks}
          currentWeek={wk}
          mentalPctA={mlTotal ? mlPctA : null}
          onDismiss={() => {
            localStorage.setItem('homeranking:recapSeen', lastWeek.week)
            setRecapSeen(lastWeek.week)
          }}
        />
      )}

      {(streak > 0 || month.alix + month.david > 0) && (
        <section className="standings">
          {streak > 0 && (
            <div className="standing">
              <span className="standing-label">Level weeks in a row</span>
              <span className="standing-value">{streak}</span>
            </div>
          )}
          {month.alix + month.david > 0 && (
            <div className="standing">
              <span className="standing-label">{monthName()} so far</span>
              <span className="standing-value">
                <span style={{ color: 'var(--alix)' }}>{month.alix}</span>
                <span className="standing-slash">/</span>
                <span style={{ color: 'var(--david)' }}>{month.david}</span>
              </span>
            </div>
          )}
        </section>
      )}

      <div className="search">
        <span className="search-icon" aria-hidden="true">⌕</span>
        <input
          className="search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find a chore…"
          aria-label="Find a chore"
        />
        {q && (
          <button className="search-clear" onClick={() => setQ('')} aria-label="Clear search">
            ✕
          </button>
        )}
      </div>

      {matches && (
        <section className="cat">
          <div className="sectionlabel">
            <span>{matches.length ? `${matches.length} match${matches.length === 1 ? '' : 'es'}` : 'No chore by that name'}</span>
          </div>
          <div className="cat-body">
            {matches.map((c) => (
              <Row
                key={`m-${c.id}`}
                chore={c}
                count={counts[who][c.id] ?? 0}
                onBump={(delta) => bump(who, c.id, delta)}
              />
            ))}
          </div>
        </section>
      )}

      {!matches && usual.length > 0 && (
        <section className="cat" key="usual">
          <div className="sectionlabel">
            <span>{person.name}&rsquo;s usuals</span>
            <em>most logged first</em>
          </div>
          <div className="cat-body">
            {usual.map((c) => (
              <Row
                key={`usual-${c.id}`}
                chore={c}
                count={counts[who][c.id] ?? 0}
                onBump={(delta) => bump(who, c.id, delta)}
              />
            ))}
          </div>
        </section>
      )}

      {!matches && groups.map((cat) => {
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

/* ---------------- household & sync ---------------- */

function SyncBar({ sync }: { sync: ReturnType<typeof useSync> }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const connected = !!sync.household

  const label = connected
    ? sync.state === 'live'
      ? 'synced'
      : sync.state === 'offline'
        ? 'offline'
        : 'connecting'
    : sync.state === 'error'
      ? 'this device'
      : 'setting up'

  const share = async () => {
    if (!sync.shareUrl) return
    const data = { title: 'HomeRanking', text: 'Our week, shared.', url: sync.shareUrl }
    try {
      if (navigator.share) await navigator.share(data)
      else {
        await navigator.clipboard.writeText(sync.shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch {
      /* dismissed */
    }
  }

  return (
    <div className="sync">
      <button
        className="hdr-pill glass"
        data-state={connected ? sync.state : 'none'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="hdr-dot" />
        {weekLabel()} · {label}
      </button>

      {open && (
        <div className="sync-panel">
          {connected ? (
            <>
              <p className="sync-note">
                Send Alix this link. She opens it once and both phones show the same week.
              </p>
              <div className="sync-actions">
                <button className="ghost" data-primary="true" onClick={share}>
                  {copied ? 'Link copied ✓' : 'Send the link'}
                </button>
                <button className="ghost" onClick={sync.leave}>
                  Disconnect
                </button>
              </div>
              <span className="setup-hint">Code: {sync.household!.code}</span>
            </>
          ) : (
            <>
              <p className="sync-note">
                Everything you log is safe on this device. Sharing between phones needs
                the database switched on once.
              </p>
              <SetupGuide />
            </>
          )}
          {sync.error && <p className="sync-error">{sync.error}</p>}
        </div>
      )}
    </div>
  )
}

/**
 * The two setup steps need a signed-in dashboard, so they cannot be automated
 * from the app. This keeps them to one tap and one paste each.
 */
function SetupGuide() {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SCHEMA_SQL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="setup">
      <button className="setup-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        First time? Two one-off steps
        <span className="caret" data-open={open} />
      </button>

      {open && (
        <ol className="setup-steps">
          <li>
            <span className="setup-step">Create the tables</span>
            <div className="sync-actions">
              <button className="ghost" onClick={copy}>
                {copied ? 'SQL copied ✓' : 'Copy the SQL'}
              </button>
              <a className="ghost" href={SQL_EDITOR} target="_blank" rel="noreferrer">
                Open SQL editor ↗
              </a>
            </div>
            <span className="setup-hint">Paste it in, press Run. Once, ever.</span>
          </li>
          <li>
            <span className="setup-step">Wake the API up</span>
            <div className="sync-actions">
              <button
                className="ghost"
                onClick={() => navigator.clipboard?.writeText("notify pgrst, 'reload schema';")}
              >
                Copy the one-liner
              </button>
            </div>
            <span className="setup-hint">
              Run it in the same editor. Supabase caches the schema, so new functions stay
              invisible until it is told to look again.
            </span>
          </li>
          <li>
            <span className="setup-step">Allow anonymous sign-in</span>
            <div className="sync-actions">
              <a className="ghost" href={AUTH_PROVIDERS} target="_blank" rel="noreferrer">
                Open providers ↗
              </a>
            </div>
            <span className="setup-hint">
              Turn on “Anonymous sign-ins”. Your invite code is what actually guards the
              data, so nobody needs an account or a password.
            </span>
          </li>
        </ol>
      )}
    </div>
  )
}
