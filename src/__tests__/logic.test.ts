import { describe, expect, it } from 'vitest'
import { splitOf, streakOf, verdictOf, monthOf, monthKey } from '../close'
import { targetLabel } from '../labels'
import { milestonesOf, choreOfTheWeek, kindLine } from '../milestones'
import { weekKey, weekStart, daysLeft } from '../week'

const W = (week: string, alix: number, david: number) => ({ week, alix, david })

describe('week boundaries', () => {
  it('starts the week on Monday whatever day it is', () => {
    // Wed 29 Jul 2026 and the Sunday after belong to the same week
    expect(weekKey(new Date(2026, 6, 29))).toBe('2026-07-27')
    expect(weekKey(new Date(2026, 7, 2))).toBe('2026-07-27')
    // the next Monday starts a new one
    expect(weekKey(new Date(2026, 7, 3))).toBe('2026-08-03')
  })

  it('treats Sunday as the last day, not the first', () => {
    expect(weekStart(new Date(2026, 7, 2)).getDate()).toBe(27)
    expect(daysLeft(new Date(2026, 7, 2))).toBe(1)
    expect(daysLeft(new Date(2026, 6, 27))).toBe(7)
  })
})

describe('balance', () => {
  it('calls a week level only within 10 points of even', () => {
    expect(splitOf(W('w', 50, 50)).level).toBe(true)
    expect(splitOf(W('w', 55, 45)).level).toBe(true)
    expect(splitOf(W('w', 70, 30)).level).toBe(false)
  })

  it('does not call an empty week level — there is nothing to be level about', () => {
    expect(splitOf(W('w', 0, 0)).level).toBe(false)
  })
})

describe('streak', () => {
  it('counts back consecutive level weeks and stops at the first tilted one', () => {
    const weeks = [W('2026-07-06', 50, 50), W('2026-07-13', 80, 20), W('2026-07-20', 50, 50)]
    expect(streakOf(weeks, '2026-07-27')).toBe(1)
  })

  it('excludes the week in progress', () => {
    const weeks = [W('2026-07-20', 50, 50), W('2026-07-27', 90, 10)]
    expect(streakOf(weeks, '2026-07-27')).toBe(1)
  })
})

describe('verdict', () => {
  it('leads with the mental-load gap when the totals hide it', () => {
    const v = verdictOf(W('w', 50, 50), 70)
    expect(v.headline).toBe('Level on paper')
    expect(v.tone).toBe('warn')
  })

  it('celebrates a level week when the mental load is level too', () => {
    expect(verdictOf(W('w', 50, 50), 52).tone).toBe('good')
  })

  it('never scolds an empty week', () => {
    expect(verdictOf(W('w', 0, 0), null).tone).toBe('good')
  })
})

describe('target labels', () => {
  it('never shows a raw fraction', () => {
    for (const v of [7, 5, 3, 2, 1, 0.5, 0.25, 0.1]) {
      expect(targetLabel(v)).not.toMatch(/\d\.\d/)
    }
    expect(targetLabel(0.5)).toBe('2 wks')
    expect(targetLabel(0.1)).toBe('Rarely')
    expect(targetLabel(7)).toBe('Daily')
  })
})

describe('milestones', () => {
  it('are shared, so neither person can hold one alone', () => {
    const ms = milestonesOf([W('2026-07-20', 300, 250)], { alix: 300, david: 250 }, 50)
    expect(ms.find((m) => m.id === 'points')!.achieved).toBe(true)
    expect(ms.every((m) => !/alix|david/i.test(m.title))).toBe(true)
  })

  it('only counts mental load as seen when it is actually shared', () => {
    const lop = milestonesOf([], { alix: 0, david: 0 }, 80)
    expect(lop.find((m) => m.id === 'mental')!.achieved).toBe(false)
    const even = milestonesOf([], { alix: 0, david: 0 }, 55)
    expect(even.find((m) => m.id === 'mental')!.achieved).toBe(true)
  })
})

describe('chore of the week', () => {
  it('picks the biggest points contribution, not the biggest count', () => {
    const rows = [
      { week: 'w', person: 'alix' as const, choreId: 'a', count: 9, points: 3 },
      { week: 'w', person: 'david' as const, choreId: 'b', count: 4, points: 11 },
    ]
    expect(choreOfTheWeek(rows, 'w', (id) => id)!.name).toBe('b')
  })

  it('ignores other weeks', () => {
    const rows = [{ week: 'other', person: 'alix' as const, choreId: 'a', count: 9, points: 9 }]
    expect(choreOfTheWeek(rows, 'w', (id) => id)).toBeNull()
  })
})

describe('closing line', () => {
  it('names the invisible work when it was lopsided', () => {
    expect(kindLine(true, true)).toMatch(/noticing/i)
  })
})

describe('monthly standing', () => {
  it('only counts weeks starting in that month', () => {
    const weeks = [W('2026-07-27', 10, 10), W('2026-08-03', 5, 5)]
    expect(monthOf(weeks, '2026-07')).toEqual({ alix: 10, david: 10 })
  })

  it('formats the key as YYYY-MM', () => {
    expect(monthKey(new Date(2026, 6, 27))).toBe('2026-07')
  })
})
