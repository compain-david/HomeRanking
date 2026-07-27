/**
 * A tiny local error log. There is no server to report to, and adding one for
 * a two-person app would be more privacy cost than it is worth — but a failure
 * on the other phone should still leave a trace someone can read out.
 */
const KEY = 'homeranking:errors'
const MAX = 20

export type LoggedError = { at: string; msg: string }

export function readErrors(): LoggedError[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function logError(msg: string) {
  try {
    const at = new Date().toISOString().slice(5, 16).replace('T', ' ')
    const next = [{ at, msg: msg.slice(0, 200) }, ...readErrors()].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* logging must never be the thing that breaks the app */
  }
}

export function clearErrors() {
  localStorage.removeItem(KEY)
}

export function installErrorLogging() {
  window.addEventListener('error', (e) => logError(e.message))
  window.addEventListener('unhandledrejection', (e) =>
    logError(String((e as PromiseRejectionEvent).reason).slice(0, 200)),
  )
}
