import { splitOf, streakOf, verdictOf, type WeekRow } from './close'

/**
 * Shown once, at the start of a new week, about the week that just finished.
 * It is the only moment in the app that looks backwards, and it is dismissible
 * rather than blocking — nobody should have to acknowledge a verdict about
 * housework before they can log the dishes.
 */
export default function Recap({
  week,
  weeks,
  currentWeek,
  mentalPctA,
  onDismiss,
}: {
  week: WeekRow
  weeks: WeekRow[]
  currentWeek: string
  mentalPctA: number | null
  onDismiss: () => void
}) {
  const { pctA, total } = splitOf(week)
  const verdict = verdictOf(week, mentalPctA)
  const streak = streakOf(weeks, currentWeek)

  return (
    <section className="recap" data-tone={verdict.tone}>
      <div className="recap-head">
        <span className="recap-eyebrow">Last week</span>
        <button className="recap-close" onClick={onDismiss} aria-label="Dismiss">
          ✕
        </button>
      </div>

      <h2 className="recap-headline">{verdict.headline}</h2>
      <p className="recap-detail">{verdict.detail}</p>

      {total > 0 && (
        <div className="recap-bar" aria-label={`Alix ${pctA}%, David ${100 - pctA}%`}>
          <span className="recap-a" style={{ width: `${pctA}%` }}>
            <span className="recap-num">{week.alix}</span>
          </span>
          <span className="recap-d" style={{ width: `${100 - pctA}%` }}>
            <span className="recap-num">{week.david}</span>
          </span>
        </div>
      )}

      <div className="recap-foot">
        <span className="recap-streak">
          {streak > 0
            ? `${streak} level ${streak === 1 ? 'week' : 'weeks'} in a row`
            : 'No streak yet — a level week starts one'}
        </span>
        <button className="ghost" data-primary="true" onClick={onDismiss}>
          Start the week
        </button>
      </div>
    </section>
  )
}
