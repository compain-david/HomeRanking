import { useEffect, useRef, useState } from 'react'
import { splitOf, streakOf, verdictOf, type WeekRow } from './close'
import { choreOfTheWeek, kindLine, milestonesOf } from './milestones'
import type { HistoryRow } from './useSync'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Slide, not tap. Closing a week is the one irreversible-feeling action in the
 * app, and a deliberate gesture makes it hard to do by accident. Anyone who
 * cannot drag — keyboard, screen reader, reduced motion — gets a plain button
 * instead, which is a real control rather than a hidden fallback.
 */
export function CloseSlider({ onClose }: { onClose: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)

  if (reduced()) {
    return (
      <button className="closebtn glass" onClick={onClose}>
        Close the week
      </button>
    )
  }

  const travel = () => {
    const t = trackRef.current
    return t ? t.clientWidth - 52 : 1
  }

  const move = (clientX: number, startX: number, startLeft: number) => {
    const next = Math.max(0, Math.min(travel(), startLeft + (clientX - startX)))
    setX(next)
  }

  const begin = (e: React.PointerEvent) => {
    const startX = e.clientX
    const startLeft = x
    setDragging(true)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)

    const onMove = (ev: PointerEvent) => move(ev.clientX, startX, startLeft)
    const onUp = (ev: PointerEvent) => {
      move(ev.clientX, startX, startLeft)
      setDragging(false)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const t = travel()
      const done = (startLeft + (ev.clientX - startX)) / t >= 0.85
      if (done) {
        setX(t)
        setTimeout(onClose, 350)
      } else {
        setX(0)
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const pct = Math.round((x / Math.max(1, travel())) * 100)

  return (
    <div className="slider glass" ref={trackRef}>
      <div
        className="slider-thumb"
        role="button"
        tabIndex={0}
        aria-label="Slide to close the week"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ transform: `translateX(${x}px)`, transition: dragging ? 'none' : undefined }}
        onPointerDown={begin}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClose()
          }
        }}
      >
        →
      </div>
      <span className="slider-label">Slide to close the week</span>
      <span className="slider-chevrons" aria-hidden="true">
        ›››
      </span>
    </div>
  )
}

export function RecapOverlay({
  week,
  weeks,
  rows,
  currentWeek,
  mentalPctA,
  totals,
  nameOf,
  onAllTime,
  onDone,
}: {
  week: WeekRow
  weeks: WeekRow[]
  rows: HistoryRow[]
  currentWeek: string
  mentalPctA: number | null
  totals: { alix: number; david: number }
  nameOf: (id: string) => string
  onAllTime: () => void
  onDone: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { pctA, level } = splitOf(week)
  const verdict = verdictOf(week, mentalPctA)
  const streak = streakOf(weeks, currentWeek)
  const star = choreOfTheWeek(rows, week.week, nameOf)
  const won = milestonesOf(weeks, totals, mentalPctA).find((m) => m.achieved)
  const lopsided = mentalPctA !== null && Math.abs(mentalPctA - 50) >= 10

  // a dialog you cannot escape from is a trap, not a ceremony
  useEffect(() => {
    cardRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onDone])

  return (
    <div className="scrim" onClick={onDone}>
      <div
        className="recapcard glass"
        role="dialog"
        aria-modal="true"
        aria-label="The week, seen"
        tabIndex={-1}
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="recap-eyebrow">Week closed</span>
        <h2 className="lede-title" style={{ fontSize: 28 }}>
          The week, <em>seen.</em>
        </h2>

        <div className="hero-totals" style={{ marginTop: 16 }}>
          <div className="hero-side" data-side="left">
            <span className="hero-name">Alix</span>
            <span className="hero-num" data-who="alix" style={{ fontSize: 42 }}>
              {week.alix}
            </span>
          </div>
          <span className="hero-chip">{level ? 'in balance' : `${pctA > 50 ? 'Alix' : 'David'} ahead`}</span>
          <div className="hero-side" data-side="right">
            <span className="hero-name">David</span>
            <span className="hero-num" data-who="david" style={{ fontSize: 42 }}>
              {week.david}
            </span>
          </div>
        </div>

        <div className="beam2" style={{ margin: '14px 0 10px' }}>
          <span className="beam2-side" data-side="left">
            <span
              className="beam2-arm"
              data-who="alix"
              style={{ width: `${(week.alix / Math.max(week.alix, week.david, 1)) * 100}%` }}
            />
          </span>
          <span className="beam2-pivot" />
          <span className="beam2-side" data-side="right">
            <span
              className="beam2-arm"
              data-who="david"
              style={{ width: `${(week.david / Math.max(week.alix, week.david, 1)) * 100}%` }}
            />
          </span>
        </div>

        <p className="recap-detail">{verdict.detail}</p>

        {star && (
          <div className="recap-card">
            <span className="drill-title">Chore of the week</span>
            <span className="recap-card-title">{star.name}</span>
            <span className="recap-card-note">
              ×{star.times} between you · {star.pts} pts of the week
            </span>
          </div>
        )}

        {won && (
          <div className="recap-card" data-badge="true">
            <span className="recap-badge" aria-hidden="true">
              ✓
            </span>
            <div>
              <span className="recap-card-title">{won.title}</span>
              <span className="recap-card-note">a milestone you reached together</span>
            </div>
          </div>
        )}

        <p className="kindline">{kindLine(level, lopsided)}</p>

        {streak > 0 && (
          <p className="recap-streak" style={{ textAlign: 'center' }}>
            {streak} level {streak === 1 ? 'week' : 'weeks'} in a row
          </p>
        )}

        <div className="recap-actions">
          <button className="ghost" onClick={onAllTime}>
            Since the beginning
          </button>
          <button className="ghost" data-primary="true" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
