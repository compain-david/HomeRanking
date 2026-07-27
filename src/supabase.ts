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

/**
 * One household, shared by every device that opens this app.
 *
 * Letting each device create its own meant two phones could both report
 * "synced" while holding completely different data — a worse failure than not
 * syncing at all, because nothing looked wrong. A fixed code makes every
 * device converge on the same household with no join step.
 *
 * The trade-off, stated plainly: this code ships inside the public bundle, so
 * anyone who finds the site and reads its source could join. For a two-person
 * chore list on an unlisted URL that is an acceptable price for never having
 * to think about setup again. Change it here to lock everyone out and start
 * fresh.
 */
export const HOUSEHOLD_CODE =
  import.meta.env.VITE_HOUSEHOLD_CODE ?? 'A11X0DAV'
