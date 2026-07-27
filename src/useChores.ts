import { useCallback, useEffect, useState } from 'react'
import { CATEGORIES, type Chore } from './data/chores'
import { supabase } from './supabase'

export type EditableChore = Chore & { active: boolean; sortOrder: number; emoji: string }

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name)
export const CATEGORY_EMOJI = Object.fromEntries(CATEGORIES.map((c) => [c.name, c.emoji]))

const LOCAL_KEY = 'homeranking:chores:v1'

const defaults = (): EditableChore[] =>
  CATEGORIES.flatMap((cat, ci) =>
    cat.chores.map((c, i) => ({ ...c, active: true, sortOrder: ci * 100 + i, emoji: '' })),
  )

function readLocal(): EditableChore[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return defaults()
    const parsed = JSON.parse(raw) as EditableChore[]
    return Array.isArray(parsed) && parsed.length ? parsed : defaults()
  } catch {
    return defaults()
  }
}

const toRow = (c: EditableChore, householdId: string) => ({
  household_id: householdId,
  chore_key: c.id,
  name: c.name,
  category: c.category,
  effort: c.effort,
  aversion: c.aversion,
  mental_load: c.mentalLoad,
  weekly_target: c.target,
  emoji: c.emoji ?? '',
  sort_order: c.sortOrder,
  is_active: c.active,
})

/**
 * The chore list belongs to the household, not the device: points only mean
 * something if both phones score the same chore the same way. It is kept
 * locally too, so the app still works before the database is reachable.
 */
export function useChores(householdId: string | null) {
  const [chores, setChores] = useState<EditableChore[]>(readLocal)

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(chores))
  }, [chores])

  // Pull the household's list, seeding it from the defaults the first time.
  useEffect(() => {
    if (!householdId) return
    let active = true
    ;(async () => {
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .eq('household_id', householdId)
        .order('sort_order')
      if (error || !active) return

      if (!data?.length) {
        const seed = defaults()
        await supabase.from('chores').upsert(
          seed.map((c) => toRow(c, householdId)),
          { onConflict: 'household_id,chore_key' },
        )
        if (active) setChores(seed)
        return
      }

      setChores(
        data.map((r) => ({
          id: r.chore_key,
          name: r.name,
          category: r.category,
          effort: r.effort,
          aversion: r.aversion,
          mentalLoad: r.mental_load,
          target: Number(r.weekly_target),
          emoji: r.emoji ?? '',
          active: r.is_active,
          sortOrder: r.sort_order,
        })),
      )
    })()
    return () => {
      active = false
    }
  }, [householdId])

  // Another phone editing a score must not leave this one scoring differently.
  useEffect(() => {
    if (!householdId) return
    const channel = supabase
      .channel(`chores:${householdId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chores', filter: `household_id=eq.${householdId}` },
        async () => {
          const { data } = await supabase
            .from('chores')
            .select('*')
            .eq('household_id', householdId)
            .order('sort_order')
          if (!data) return
          setChores(
            data.map((r) => ({
              id: r.chore_key,
              name: r.name,
              category: r.category,
              effort: r.effort,
              aversion: r.aversion,
              mentalLoad: r.mental_load,
              target: Number(r.weekly_target),
              emoji: r.emoji ?? '',
              active: r.is_active,
              sortOrder: r.sort_order,
            })),
          )
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId])

  const save = useCallback(
    async (next: EditableChore) => {
      setChores((prev) => prev.map((c) => (c.id === next.id ? next : c)))
      if (householdId) {
        await supabase
          .from('chores')
          .upsert(toRow(next, householdId), { onConflict: 'household_id,chore_key' })
      }
    },
    [householdId],
  )

  const add = useCallback(
    async (category: string) => {
      const key = `u${Date.now().toString(36)}`
      const created: EditableChore = {
        id: key,
        name: '',
        category,
        effort: 1,
        aversion: 1,
        mentalLoad: 1,
        target: 1,
        emoji: '',
        active: true,
        sortOrder: 9000,
      }
      setChores((prev) => [...prev, created])
      if (householdId) await supabase.from('chores').insert(toRow(created, householdId))
      return created
    },
    [householdId],
  )

  // Deactivating keeps the history a deletion would take with it.
  const setActive = useCallback(
    async (id: string, active: boolean) => {
      const target = chores.find((c) => c.id === id)
      if (target) await save({ ...target, active })
    },
    [chores, save],
  )

  const remove = useCallback(
    async (id: string) => {
      setChores((prev) => prev.filter((c) => c.id !== id))
      if (householdId) {
        await supabase.from('chores').delete().eq('household_id', householdId).eq('chore_key', id)
      }
    },
    [householdId],
  )

  /** Swap sort order with the neighbour above or below, within a category. */
  const move = useCallback(
    async (id: string, dir: -1 | 1) => {
      const me = chores.find((c) => c.id === id)
      if (!me) return
      const siblings = chores
        .filter((c) => c.category === me.category)
        .sort((a, b) => a.sortOrder - b.sortOrder)
      const i = siblings.findIndex((c) => c.id === id)
      const other = siblings[i + dir]
      if (!other) return
      const a = { ...me, sortOrder: other.sortOrder }
      const b = { ...other, sortOrder: me.sortOrder }
      setChores((prev) => prev.map((c) => (c.id === a.id ? a : c.id === b.id ? b : c)))
      if (householdId) {
        await supabase
          .from('chores')
          .upsert([toRow(a, householdId), toRow(b, householdId)], {
            onConflict: 'household_id,chore_key',
          })
      }
    },
    [chores, householdId],
  )

  const replaceAll = useCallback(
    async (next: EditableChore[]) => {
      setChores(next)
      if (householdId) {
        await supabase.from('chores').delete().eq('household_id', householdId)
        await supabase.from('chores').insert(next.map((c) => toRow(c, householdId)))
      }
    },
    [householdId],
  )

  const reset = useCallback(async () => {
    const seed = defaults()
    setChores(seed)
    if (householdId) {
      await supabase.from('chores').delete().eq('household_id', householdId)
      await supabase.from('chores').insert(seed.map((c) => toRow(c, householdId)))
    }
  }, [householdId])

  return { chores, save, add, setActive, remove, reset, move, replaceAll }
}
