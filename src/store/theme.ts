import { useSyncExternalStore } from 'react'

const KEY = 'rw.theme.v1'
export type Theme = 'system' | 'light' | 'dark'
const THEMES: Theme[] = ['system', 'light', 'dark']

function read(): Theme {
  try {
    const v = localStorage.getItem(KEY) as Theme | null
    return v && THEMES.includes(v) ? v : 'system'
  } catch {
    return 'system'
  }
}

let theme = read()
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

function apply() {
  if (theme === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.dataset.theme = theme
}

/** Call once at startup so the saved choice is applied before first paint. */
export const initTheme = apply
export const useTheme = () => useSyncExternalStore(subscribe, () => theme)
export const THEME_OPTIONS = THEMES

export function setTheme(t: Theme) {
  theme = t
  try {
    localStorage.setItem(KEY, t)
  } catch { /* in-memory only */ }
  apply()
  listeners.forEach((l) => l())
}
