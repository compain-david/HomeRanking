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
  if (m.includes('does not exist') || m.includes('schema cache'))
    return 'The database tables are not set up yet. Run supabase/schema.sql in the Supabase SQL editor.'
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
export function useSync(weekStart: string, local: Counts, onRemote: (c: Counts) => void) {
  const [household, setHousehold] = useState<Household | null>(readHousehold)
  const [state, setState] = useState<SyncState>('connecting')
  const [error, setError] = useState<string | null>(null)
  const onRemoteRef = useRef(onRemote)
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

  const leave = useCallback(() => {
    localStorage.removeItem(HOUSEHOLD_KEY)
    setHousehold(null)
    setState('connecting')
  }, [])

  return { household, state, error, push, create, join, leave }
}
