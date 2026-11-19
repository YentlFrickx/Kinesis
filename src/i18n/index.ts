import { useCallback, useSyncExternalStore } from 'react'
import type { Exercise } from '../data/types'
import { DEFAULT_LOCALE, LOCALES, LOCALE_INFO, detectLocale, matchLocale, starterName, translate, type Locale, type Params, type TranslationKey } from './core'
import type { MessageKey } from './en'
import { COACHING_TEXT, EXERCISE_TEXT } from './exerciseText'

export { LOCALES, LOCALE_INFO, type Locale, type MessageKey, type TranslationKey }

const KEY = 'rw.lang.v1'

function read(): Locale {
  try {
    const saved = matchLocale(localStorage.getItem(KEY))
    if (saved) return saved
  } catch { /* storage unavailable */ }
  return detectLocale(typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language])
}

let locale: Locale = read()
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

function applyLang() {
  if (typeof document !== 'undefined') document.documentElement.lang = locale
}

/** Call once at startup so <html lang> matches before first paint. */
export const initLocale = applyLang
export const getLocale = () => locale
export const useLocale = () => useSyncExternalStore(subscribe, () => locale)

export function setLocale(next: Locale) {
  locale = next
  try {
    localStorage.setItem(KEY, next)
  } catch { /* in-memory only */ }
  applyLang()
  listeners.forEach((l) => l())
}

/** Translate with the current locale (non-reactive: call from components that also use `useT`/`useLocale`). */
export const t = (key: TranslationKey, params?: Params) => translate(locale, key, params)

/** Reactive translate function: components using it re-render when the language changes. */
export function useT() {
  const l = useLocale()
  return useCallback((key: TranslationKey, params?: Params) => translate(l, key, params), [l])
}

const cache = new Map<Locale, Map<string, Exercise>>()

/** The exercise with its name and instructions in `l` (English fallback per exercise); a gear modifier is added to the title ("Calf raise with dumbbells"). */
export function localizeExercise(e: Exercise, l: Locale = locale): Exercise {
  const key = `${e.id}|${e.gearUsed ?? ''}`
  let byKey = cache.get(l)
  if (!byKey) cache.set(l, (byKey = new Map()))
  let out = byKey.get(key)
  if (out) return out
  const text = l === DEFAULT_LOCALE ? undefined : EXERCISE_TEXT[l]?.[e.id]
  const c = COACHING_TEXT[l]?.[e.id]
  out = text ? { ...e, name: text.name, instructions: text.instructions, ...(c && e.cues ? { cues: c.cues, commonMistakes: c.commonMistakes } : {}) } : e
  if (e.gearUsed) out = { ...out, name: translate(l, 'gear.with', { name: out.name, gear: translate(l, `gear.with.${e.gearUsed}`) }) }
  byKey.set(key, out)
  return out
}

export function useLocalize() {
  const l = useLocale()
  return useCallback((e: Exercise) => localizeExercise(e, l), [l])
}

/** Session name for display: starter sessions follow the language unless the user renamed them. */
export const sessionLabel = (id: string, name: string) => starterName(locale, id, name)

/** Intl date formatting in the current language. */
