export type Theme = 'system' | 'light' | 'dark'

const KEY = 'homeranking:theme'

export const readTheme = (): Theme => (localStorage.getItem(KEY) as Theme) || 'system'

/**
 * Following the phone is the right default, but it should not be the only
 * option: two people sharing an app should not be forced into different
 * looks because one of them keeps their phone in light mode.
 */
export function applyTheme(t: Theme) {
  localStorage.setItem(KEY, t)
  const root = document.documentElement
  if (t === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', t)

  const dark =
    t === 'dark' ||
    (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute('content', dark ? '#0e1211' : '#f1f3f0'))
}
