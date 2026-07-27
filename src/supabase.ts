import { createClient } from '@supabase/supabase-js'

/**
 * The publishable key is public by design — it ships inside any static build,
 * so treating it as a secret would be theatre. Every access guarantee comes
 * from the Row Level Security policies in supabase/schema.sql instead.
 *
 * The secret key is never used by this app and must never appear here.
 */
const URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://jasildjjlncoriepjosp.supabase.co'
const KEY =
  import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_80kh8mc_gQZiYRwOnTE-9A_sUBW2BzG'

export const supabase = createClient(URL, KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
})

export const HOUSEHOLD_KEY = 'homeranking:household'
