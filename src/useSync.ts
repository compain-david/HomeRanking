import { useCallback, useEffect, useRef, useState } from 'react'
import { HOUSEHOLD_KEY, supabase } from './supabase'

export type PersonId = 'alix' | 'david'
export type Counts = Record<PersonId, Record<string, number>>
export const EMPTY_COUNTS: Counts = { alix: {}, david: {} }

export type SyncState = 'offline' | 'connecting' | 'live' | 'error'

/** Turns a Supabase/network error into something worth showing a person. */
function readable(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('failed to fetch') || m.includes('networkerror'))
    return 'Could not reach the server. Your week is safe on this device and will sync when you are back online.'
  if (m.includes('disabled') || m.includes('anonymous'))
    return 'Anonymous sign-ins are switched off. Turn them on in Supabase under Authentication → Sign In / Providers.'
  if (m.includes('function') || m.includes('schema cache'))
    return "The database is set up but Supabase has not noticed yet. Run: notify pgrst, 'reload schema';"
  if (m.includes('relation') && m.includes('does not exist'))
    return 'The tables are missing. Run supabase/schema.sql in the Supabase SQL editor.'
  if (m.includes('no household')) return 'No household has that code. Check it and try again.'
  return message
}

type Household = { id: string; code: string }

const readHousehold = (): Household | null => {
  try {
    const raw = localStorage.getItem(HOUSEHOLD_KEY)
    return raw ? (JSON.parse(raw) as Household) : null
  } catch {
    return null
  }
}

/**
 * Local state stays the source of truth for what you see: a tap must land
 * instantly and survive a dead kitchen wifi. Writes are pushed afterwards, and
 * anything the other phone changes arrives over realtime and is merged in.
 */
export type HistoryRow = {
  week: string
  person: PersonId
  choreId: string
  count: number
  points: number
}

export type History = {
  /** the raw entries, so an export can be truthful about granularity */
  rows: HistoryRow[]
  weeks: { week: string; alix: number; david: number }[]
  totals: { alix: number; david: number }
  /** times each person has done each chore — a household total would hide
      exactly the thing this app exists to show */
  perChore: Record<string, { alix: number; david: number }>
}

export function useSync(
  weekStart: string,
  local: Counts,
  onRemote: (c: Counts) => void,
  pointsFor: (choreId: string) => number,
) {
  const [household, setHousehold] = useState<Household | null>(readHousehold)
  const [state, setState] = useState<SyncState>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<History | null>(null)
  const onRemoteRef = useRef(onRemote)
  const pointsForRef = useRef(pointsFor)
  pointsForRef.current = pointsFor
  const localRef = useRef(local)
  // Writes that failed while offline. Without this, a pull on reconnect would
  // quietly overwrite anything logged with no signal.
  const pendingRef = useRef(new Map<string, { person: PersonId; choreId: string; count: number }>())
  onRemoteRef.current = onRemote
  localRef.current = local

  // Anonymous sign-in: the household invite code is the shared secret, so
  // there is no password or email round trip to sit through every week.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session || cancelled) return
      const { error } = await supabase.auth.signInAnonymously()
      if (error && !cancelled) {
        setState('error')
        setError(readable(error.message))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const pull = useCallback(
    async (h: Household) => {
      const { data, error } = await supabase
        .from('entries')
        .select('person, chore_id, count')
        .eq('household_id', h.id)
        .eq('week_start', weekStart)
      if (error) {
        setState('offline')
        setError(readable(error.message))
        return
      }
      const next: Counts = { alix: {}, david: {} }
      for (const row of data ?? []) {
        if (row.count > 0) next[row.person as PersonId][row.chore_id] = row.count
      }
      onRemoteRef.current(next)
      setState('live')
      setError(null)
    },
    [weekStart],
  )

  /** Replay anything that failed while offline, newest value per chore. */
  const flush = useCallback(async () => {
    if (!household || pendingRef.current.size === 0) return
    const rows = [...pendingRef.current.values()].map((p) => ({
      household_id: household.id,
      person: p.person,
      chore_id: p.choreId,
      week_start: weekStart,
      count: p.count,
      updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase
      .from('entries')
      .upsert(rows, { onConflict: 'household_id,person,chore_id,week_start' })
    if (!error) pendingRef.current.clear()
  }, [household, weekStart])

  // Initial pull plus a realtime subscription for the other phone's changes.
  useEffect(() => {
    if (!household) return
    let active = true
    // replay first, then pull, so reconnecting never discards offline taps
    flush().then(() => {
      if (active) pull(household)
    })

    const onOnline = () => {
      flush().then(() => {
        if (active) pull(household)
      })
    }
    window.addEventListener('online', onOnline)

    const channel = supabase
      .channel(`entries:${household.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entries',
          filter: `household_id=eq.${household.id}`,
        },
        () => {
          if (active) pull(household)
        },
      )
      .subscribe((status) => {
        if (!active) return
        if (status === 'SUBSCRIBED') setState('live')
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setState('offline')
      })

    return () => {
      active = false
      window.removeEventListener('online', onOnline)
      supabase.removeChannel(channel)
    }
  }, [household, pull, flush])

  const push = useCallback(
    async (person: PersonId, choreId: string, count: number) => {
      if (!household) return
      const key = `${person}:${choreId}`
      const { error } = await supabase.from('entries').upsert(
        {
          household_id: household.id,
          person,
          chore_id: choreId,
          week_start: weekStart,
          count,
          points: pointsForRef.current(choreId),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'household_id,person,chore_id,week_start' },
      )
      if (error) {
        pendingRef.current.set(key, { person, choreId, count })
        setState('offline')
      } else {
        pendingRef.current.delete(key)
        setState('live')
      }
    },
    [household, weekStart],
  )

  const pushAll = useCallback(
    async (counts: Counts) => {
      if (!household) return
      const rows = (['alix', 'david'] as PersonId[]).flatMap((person) =>
        Object.entries(counts[person]).map(([chore_id, count]) => ({
          household_id: household.id,
          person,
          chore_id,
          week_start: weekStart,
          count,
          updated_at: new Date().toISOString(),
        })),
      )
      if (!rows.length) return
      await supabase
        .from('entries')
        .upsert(rows, { onConflict: 'household_id,person,chore_id,week_start' })
    },
    [household, weekStart],
  )

  /** A code handed over in a link: homeranking/#join=ABCD1234 */
  const codeFromUrl = () => {
    const m = /[#?&]join=([A-Za-z0-9]+)/.exec(window.location.hash + window.location.search)
    return m ? m[1].toUpperCase() : null
  }

  const create = useCallback(async () => {
    setError(null)
    const { data, error } = await supabase.rpc('create_household', { p_name: 'Our home' })
    if (error || !data?.[0]) {
      setError(error ? readable(error.message) : 'Could not create the household.')
      return
    }
    const h = { id: data[0].id as string, code: data[0].invite_code as string }
    localStorage.setItem(HOUSEHOLD_KEY, JSON.stringify(h))
    setHousehold(h)
    // carry anything already logged on this device into the new household
    await pushAll(localRef.current)
  }, [pushAll])

  const join = useCallback(async (code: string) => {
    setError(null)
    const { data, error } = await supabase.rpc('join_household', { p_code: code })
    if (error || !data) {
      setError(error ? readable(error.message) : 'No household with that code.')
      return
    }
    const h = { id: data as string, code: code.trim().toUpperCase() }
    localStorage.setItem(HOUSEHOLD_KEY, JSON.stringify(h))
    setHousehold(h)
  }, [])

  // Nobody should have to decide to "start a household" — there is only ever
  // one, and it exists the moment the app opens. A link is what gets shared.
  const bootstrapped = useRef(false)
  useEffect(() => {
    if (household || bootstrapped.current) return
    bootstrapped.current = true
    ;(async () => {
      for (let i = 0; i < 20; i++) {
        const { data } = await supabase.auth.getSession()
        if (data.session) break
        await new Promise((r) => setTimeout(r, 250))
      }
      const invited = codeFromUrl()
      if (invited) {
        await join(invited)
        window.history.replaceState(null, '', window.location.pathname)
      } else {
        await create()
      }
    })()
  }, [household, create, join])

  const shareUrl = household
    ? `${window.location.origin}${window.location.pathname}#join=${household.code}`
    : null

  /** Everything ever logged, for the all-time view and the last-week recap. */
  const loadHistory = useCallback(async () => {
    if (!household) return
    const { data, error } = await supabase
      .from('entries')
      .select('person, chore_id, count, points, week_start')
      .eq('household_id', household.id)
    if (error || !data) return

    const weeks = new Map<string, { alix: number; david: number }>()
    const totals = { alix: 0, david: 0 }
    const perChore: History['perChore'] = {}
    const rows: HistoryRow[] = []

    for (const r of data) {
      if (!r.count) continue
      rows.push({
        week: r.week_start,
        person: r.person as PersonId,
        choreId: r.chore_id,
        count: r.count,
        points: r.points || pointsForRef.current(r.chore_id),
      })
      // points were frozen when logged; fall back for rows written before that
      const pts = (r.points || pointsForRef.current(r.chore_id)) * r.count
      const w = weeks.get(r.week_start) ?? { alix: 0, david: 0 }
      w[r.person as PersonId] += pts
      weeks.set(r.week_start, w)
      totals[r.person as PersonId] += pts
      const tally = (perChore[r.chore_id] ??= { alix: 0, david: 0 })
      tally[r.person as PersonId] += r.count
    }

    setHistory({
      rows,
      weeks: [...weeks.entries()]
        .map(([week, v]) => ({ week, ...v }))
        .sort((a, b) => b.week.localeCompare(a.week)),
      totals,
      perChore,
    })
  }, [household])

  useEffect(() => {
    loadHistory()
  }, [loadHistory, weekStart])

  const leave = useCallback(() => {
    localStorage.removeItem(HOUSEHOLD_KEY)
    setHousehold(null)
    setState('connecting')
  }, [])

  return { household, state, error, push, create, join, leave, shareUrl, history, loadHistory }
}
